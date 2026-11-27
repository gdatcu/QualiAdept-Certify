import * as cheerio from 'cheerio';

export interface FeedbackItem {
  check: string;
  passed: boolean;
  message: string;
  file?: string;
  ruleIndex?: number;
  diagnosticIndex?: number;
}

export interface ValidationResponse {
  status: 'pass' | 'fail' | 'pending';
  score: number;
  feedback: FeedbackItem[];
  isPartial?: boolean;
  targetFile?: string;
  submissionId?: string;
  stage?: 'static' | 'dynamic_queued' | 'dynamic_completed';
  executionLogs?: string;
}

export interface MultiFilePayload {
  files: Record<string, string>;
}

export interface ParsedSubmissionFiles {
  rawPayload: string;
  files: Record<string, string>;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  tsCode: string;
}

export interface RuleDiagnostic {
  pattern?: string;
  message?: string;
  message_en?: string;
}

export interface ValidationRule {
  file?: string;
  target?: string;
  name?: string;
  name_en?: string;
  title?: string;
  check?: string;
  type?: string;
  selector?: string;
  tag?: string;
  value?: string;
  pattern?: string;
  expected?: string;
  attrName?: string;
  attr?: string;
  includeComments?: boolean;
  message?: string;
  message_en?: string;
  successMessage?: string;
  successMessage_en?: string;
  diagnostics?: RuleDiagnostic[];
}

export function parseSubmissionFiles(body: Record<string, unknown>): ParsedSubmissionFiles {
  let files: Record<string, string> = {};
  let rawPayload = '';

  if (body.files && typeof body.files === 'object' && !Array.isArray(body.files)) {
    files = { ...(body.files as Record<string, string>) };
    rawPayload = JSON.stringify({ files });
  } else if (typeof body.codePayload === 'string') {
    rawPayload = body.codePayload;
    try {
      const parsed = JSON.parse(body.codePayload);
      if (parsed && typeof parsed.files === 'object' && !Array.isArray(parsed.files)) {
        files = { ...parsed.files };
      } else {
        files = { 'index.html': body.codePayload };
      }
    } catch {
      files = { 'index.html': body.codePayload };
    }
  } else if (
    typeof body.codePayload === 'object' &&
    body.codePayload !== null &&
    'files' in body.codePayload &&
    typeof (body.codePayload as { files?: unknown }).files === 'object'
  ) {
    files = { ...((body.codePayload as { files: Record<string, string> }).files) };
    rawPayload = JSON.stringify(body.codePayload);
  } else if (typeof body.htmlCode === 'string') {
    rawPayload = body.htmlCode;
    try {
      const parsed = JSON.parse(body.htmlCode);
      if (parsed && typeof parsed.files === 'object' && !Array.isArray(parsed.files)) {
        files = { ...parsed.files };
      } else {
        files = { 'index.html': body.htmlCode };
      }
    } catch {
      files = { 'index.html': body.htmlCode };
    }
  }

  const htmlCode =
    files['index.html'] ||
    files['sandbox.html'] ||
    files['main.html'] ||
    (Object.keys(files).length === 1 ? Object.values(files)[0] : '') ||
    '';
  const cssCode = files['style.css'] || files['styles.css'] || files['index.css'] || '';
  const jsCode = files['app.js'] || files['script.js'] || files['index.js'] || '';
  const tsCode = files['app.ts'] || files['index.ts'] || files['main.ts'] || '';

  return { rawPayload, files, htmlCode, cssCode, jsCode, tsCode };
}

export function stripCodeComments(code: string, fileName?: string): string {
  if (!code) return '';
  if (fileName?.endsWith('.css')) {
    return code.replace(/\/\*[\s\S]*?\*\//g, '');
  }
  if (fileName?.endsWith('.js') || fileName?.endsWith('.ts')) {
    return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\r\n]*/g, '$1');
  }
  if (fileName?.endsWith('.html')) {
    return code.replace(/<!--[\s\S]*?-->/g, '');
  }
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
}

export interface StaticEvaluationResult {
  checks: FeedbackItem[];
  score: number;
  isPass: boolean;
  status: 'pass' | 'fail';
  dbStatus: 'PASS' | 'FAIL';
  isPartial: boolean;
}

/**
 * Evaluates an assignment's JSON validation rules (Cheerio DOM checks, regex,
 * regexInverted with optional `includeComments`, and contextual diagnostics).
 *
 * Shared between `/api/validate/static` and Stage 1 (Static Hygiene Gate) of
 * `/api/validate/dynamic`.
 */
export function evaluateStaticRules({
  validationRulesJson,
  parsedFiles,
  locale = 'ro',
  targetFileFilter = null,
}: {
  validationRulesJson: string | null | undefined;
  parsedFiles: ParsedSubmissionFiles;
  locale?: string;
  targetFileFilter?: string | null;
}): StaticEvaluationResult {
  const isEn = locale.toLowerCase() === 'en';
  const { files, htmlCode, cssCode, jsCode, tsCode } = parsedFiles;
  const $ = cheerio.load(htmlCode);
  const checks: FeedbackItem[] = [];

  if (validationRulesJson) {
    try {
      const rules = JSON.parse(validationRulesJson) as ValidationRule[];
      if (Array.isArray(rules)) {
        for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
          const r = rules[ruleIndex];
          let passed = false;
          let diagnosticIndex: number | undefined;
          const checkType = r.check || r.type || 'exists';
          const selector = r.selector || r.tag || r.value;
          let checkName = isEn && r.name_en ? r.name_en : r.name || r.title || '';
          let msg = '';

          const defaultPassMsg = isEn ? 'Requirement validated successfully.' : 'Cerință validată cu succes.';
          const passMsg = isEn && r.successMessage_en ? r.successMessage_en : r.successMessage || defaultPassMsg;
          const failMsg = isEn && r.message_en ? r.message_en : r.message;

          // Target file code resolution
          const targetFileName =
            r.file ||
            (r.target === 'css'
              ? 'style.css'
              : r.target === 'ts'
                ? 'app.ts'
                : r.target === 'js'
                  ? 'app.js'
                  : 'index.html');

          if (targetFileFilter && targetFileName !== targetFileFilter) {
            continue;
          }

          const targetCode = targetFileName
            ? files[targetFileName] ||
              (targetFileName === 'style.css'
                ? cssCode
                : targetFileName === 'app.ts'
                  ? tsCode
                  : targetFileName === 'app.js'
                    ? jsCode
                    : '')
            : htmlCode;

          if (checkType === 'regex' || r.type === 'regex') {
            const pattern = r.pattern || r.value || '';
            const regex = new RegExp(pattern, 'i');

            // Strip comments by default so instructional comments do not produce false positives
            const evalCode = r.includeComments ? targetCode : stripCodeComments(targetCode, targetFileName);
            const cleanCssCode = stripCodeComments(cssCode, 'style.css');
            const cleanJsCode = stripCodeComments(jsCode, 'app.js');

            passed =
              regex.test(evalCode) ||
              (targetFileName === undefined && (regex.test(cleanCssCode) || regex.test(cleanJsCode)));
            checkName = checkName || r.check || (isEn ? 'Pattern check' : 'Verificare conformitate cod');

            let specificDiagMsg: string | undefined;
            if (!passed && Array.isArray(r.diagnostics)) {
              for (let dIdx = 0; dIdx < r.diagnostics.length; dIdx++) {
                const diag = r.diagnostics[dIdx];
                if (diag && typeof diag.pattern === 'string') {
                  try {
                    if (new RegExp(diag.pattern, 'i').test(evalCode)) {
                      diagnosticIndex = dIdx;
                      specificDiagMsg = isEn && diag.message_en ? diag.message_en : diag.message;
                      break;
                    }
                  } catch {
                    // Ignore malformed diagnostic regex
                  }
                }
              }
            }

            msg = passed
              ? passMsg
              : specificDiagMsg ||
                failMsg ||
                (isEn ? 'Code does not match required structure.' : 'Codul nu respectă cerința necesară.');
          } else if (checkType === 'regexInverted' || checkType === 'notRegex') {
            const pattern = r.pattern || r.value || '';
            const regex = new RegExp(pattern, 'i');
            // Opt-in `includeComments: true` inspects raw file text (e.g. M10 Inspector Hygiene Policy)
            const evalCode = r.includeComments ? targetCode : stripCodeComments(targetCode, targetFileName);

            passed = !regex.test(evalCode);
            checkName = checkName || r.check || (isEn ? 'Negative pattern check' : 'Verificare excludere tipuri');

            let specificDiagMsg: string | undefined;
            if (!passed && Array.isArray(r.diagnostics)) {
              for (let dIdx = 0; dIdx < r.diagnostics.length; dIdx++) {
                const diag = r.diagnostics[dIdx];
                if (diag?.pattern) {
                  try {
                    if (new RegExp(diag.pattern, 'i').test(evalCode)) {
                      specificDiagMsg = isEn && diag.message_en ? diag.message_en : diag.message;
                      diagnosticIndex = dIdx;
                      break;
                    }
                  } catch {
                    // Ignore malformed diagnostic regex
                  }
                }
              }
            }

            msg = passed
              ? passMsg
              : specificDiagMsg ||
                failMsg ||
                (isEn ? 'Prohibited pattern detected in code.' : 'Codul conține elemente interzise.');
          } else if (checkType === 'hasClass') {
            const expectedClass = r.expected || r.value || '';
            const matches = selector ? $(selector) : $([]);
            passed =
              matches.length > 0 &&
              matches.toArray().some((el) => {
                const classAttr = (el as { attribs?: Record<string, string> }).attribs?.class || '';
                return classAttr.split(/\s+/).includes(expectedClass);
              });
            checkName = checkName || `Element "${selector}" has class "${expectedClass}"`;
            msg = passed
              ? passMsg
              : failMsg ||
                (isEn
                  ? `Element "${selector}" is missing required class "${expectedClass}".`
                  : `Elementul "${selector}" nu are clasa obligatorie "${expectedClass}".`);
          } else if (checkType === 'hasAttribute') {
            const attrName = (r.attrName || r.attr || r.value || '').toLowerCase();
            const matches = selector ? $(selector) : $([]);
            passed =
              matches.length > 0 &&
              matches.toArray().some((el) => {
                const attribs = (el as { attribs?: Record<string, string> }).attribs || {};
                return Object.keys(attribs).some((k) => k.toLowerCase() === attrName);
              });
            checkName = checkName || `Element "${selector}" has attribute "${attrName}"`;
            msg = passed
              ? passMsg
              : failMsg ||
                (isEn
                  ? `Element "${selector}" is missing attribute "${attrName}".`
                  : `Elementul "${selector}" nu conține atributul "${attrName}".`);
          } else if (checkType === 'attribute') {
            const attrName = (r.attrName || r.attr || '').toLowerCase();
            const expected = (r.expected || r.value || '').trim();
            const matches = selector ? $(selector) : $([]);
            passed =
              matches.length > 0 &&
              matches.toArray().some((el) => {
                const attribs = (el as { attribs?: Record<string, string> }).attribs || {};
                const matchedKey = Object.keys(attribs).find((k) => k.toLowerCase() === attrName);
                const val = matchedKey ? attribs[matchedKey] : undefined;
                return val !== undefined && val.trim() === expected;
              });
            checkName = checkName || `Element "${selector}" [${attrName}="${expected}"]`;
            msg = passed
              ? passMsg
              : failMsg ||
                (isEn
                  ? `Element "${selector}" attribute "${attrName}" expected "${expected}".`
                  : `Elementul "${selector}" atributul "${attrName}" trebuia să fie "${expected}".`);
          } else if (checkType === 'attributeRegex') {
            const attrName = (r.attrName || r.attr || '').toLowerCase();
            const pattern = r.pattern || r.expected || r.value || '';
            const regex = new RegExp(pattern, 'i');
            const matches = selector ? $(selector) : $([]);
            passed =
              matches.length > 0 &&
              matches.toArray().some((el) => {
                const attribs = (el as { attribs?: Record<string, string> }).attribs || {};
                const matchedKey = Object.keys(attribs).find((k) => k.toLowerCase() === attrName);
                const val = matchedKey ? attribs[matchedKey] : undefined;
                return val !== undefined && regex.test(val.trim());
              });
            checkName = checkName || `Element "${selector}" [${attrName}]`;
            msg = passed
              ? passMsg
              : failMsg ||
                (isEn
                  ? `Element "${selector}" attribute "${attrName}" did not match pattern.`
                  : `Elementul "${selector}" atributul "${attrName}" nu are valoarea așteptată.`);
          } else if (checkType === 'textContains') {
            const expectedText = (r.expected || r.value || '').trim().toLowerCase();
            const matches = selector ? $(selector) : $([]);
            passed = matches.length > 0 && matches.text().toLowerCase().includes(expectedText);
            checkName = checkName || `Element "${selector}" contains text "${expectedText}"`;
            msg = passed
              ? passMsg
              : failMsg ||
                (isEn
                  ? `Element "${selector}" does not contain "${expectedText}".`
                  : `Elementul "${selector}" nu conține textul "${expectedText}".`);
          } else if (r.type === 'tag') {
            const tagSelector = r.value || r.selector || r.tag || '';
            passed = tagSelector ? $(tagSelector).length > 0 : false;
            checkName = checkName || `<${tagSelector}> tag exists`;
            msg = passed
              ? passMsg
              : failMsg ||
                (isEn
                  ? `Missing required <${tagSelector}> tag.`
                  : `Tag-ul obligatoriu <${tagSelector}> lipsește.`);
          } else if (r.type === 'attr') {
            const rawAttr = r.value || r.selector || '';
            const attrSelector =
              rawAttr.startsWith('[') || rawAttr.startsWith('#') || rawAttr.startsWith('.')
                ? rawAttr
                : `[${rawAttr}]`;
            passed = rawAttr ? $(attrSelector).length > 0 : false;
            checkName = checkName || `Selector "${rawAttr}" exists`;
            msg = passed
              ? passMsg
              : failMsg ||
                (isEn
                  ? `Missing required attribute or selector "${rawAttr}".`
                  : `Selectorul sau atributul "${rawAttr}" lipsește.`);
          } else {
            const targetSelector = selector || r.check;
            if (targetSelector) {
              passed = $(targetSelector).length > 0;
              checkName =
                checkName ||
                (r.check && r.check !== 'exists' ? r.check : `Element "${targetSelector}" exists`);
              msg = passed
                ? passMsg
                : failMsg ||
                  (isEn
                    ? `Missing element matching "${targetSelector}".`
                    : `Elementul "${targetSelector}" lipsește din pagină.`);
            }
          }

          if (checkName) {
            const feedbackEntry: FeedbackItem = {
              check: checkName,
              passed,
              message: msg,
              file: targetFileName || 'index.html',
              ruleIndex,
            };
            if (diagnosticIndex !== undefined) {
              feedbackEntry.diagnosticIndex = diagnosticIndex;
            }
            checks.push(feedbackEntry);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse assignment validationRules JSON:', e);
    }
  }

  // If targetFileFilter is specified and no dynamic rules matched that specific file:
  if (targetFileFilter && checks.length === 0) {
    checks.push({
      check: `Validare ${targetFileFilter}`,
      passed: true,
      message: `Fișierul ${targetFileFilter} este conform. Nu există cerințe obligatorii pentru acest fișier în acest modul.`,
      file: targetFileFilter,
    });
  }

  // Fallback to default legacy Session 1 checks ONLY if no dynamic rules were provided and no target file was filtered
  if (checks.length === 0 && !targetFileFilter && !validationRulesJson) {
    const hasMainTag = $('main').length > 0;
    checks.push({
      check: 'Main tag exists',
      passed: hasMainTag,
      message: hasMainTag
        ? 'Semantic <main> tag is present.'
        : 'Missing <main> tag. Expected a semantic <main> element.',
    });

    const hasAddTaskSection = $('#add-task-section').length > 0;
    checks.push({
      check: 'Add task section exists',
      passed: hasAddTaskSection,
      message: hasAddTaskSection
        ? 'Element with id="add-task-section" is present.'
        : 'Missing element with id="add-task-section".',
    });

    const hasSubmitBtn = $('button[data-testid="submit-btn"]').length > 0;
    checks.push({
      check: 'Submit button exists',
      passed: hasSubmitBtn,
      message: hasSubmitBtn
        ? 'Button with data-testid="submit-btn" is present.'
        : 'Missing button element with data-testid="submit-btn".',
    });
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const totalChecks = checks.length;
  const score = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 100;
  const isPass = score === 100;
  const status = isPass ? 'pass' : 'fail';
  const dbStatus = isPass ? 'PASS' : 'FAIL';
  const isPartial = Boolean(targetFileFilter);

  return {
    checks,
    score,
    isPass,
    status,
    dbStatus,
    isPartial,
  };
}
