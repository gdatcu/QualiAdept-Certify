import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/validate/static/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    assignment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    submission: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('@/lib/webhook', () => ({
  sendDiscordTriumphNotification: vi.fn().mockResolvedValue(undefined),
}));

const module8Rules = JSON.stringify([
  {
    file: 'pom.ts',
    name: '[pom.ts] 1. Interfața de date Produs (id, nume, pret, inStoc)',
    name_en: '[pom.ts] 1. Data interface Produs (id, nume, pret, inStoc)',
    check: 'regex',
    pattern: String.raw`interface\s+Produs\s*\{(?=[^}]*\bid\s*:\s*number\b)(?=[^}]*\bnume\s*:\s*string\b)(?=[^}]*\bpret\s*:\s*number\b)(?=[^}]*\binStoc\s*:\s*boolean\b)[^}]*\}`,
    message: 'Cerința 1 eșuată: Definește interface Produs cu proprietățile id: number, nume: string, pret: number și inStoc: boolean.',
    message_en: 'Requirement 1 failed: Define interface Produs with id: number, nume: string, pret: number, and inStoc: boolean.',
    successMessage: 'Interfața Produs este definită corect cu toate cele 4 câmpuri tipizate.',
    successMessage_en: 'Interface Produs is properly defined with all 4 typed properties.',
  },
  {
    file: 'pom.ts',
    name: "[pom.ts] 2. Tipul Utilitar ProdusTest = Omit<Produs, 'id'>",
    name_en: "[pom.ts] 2. Utility Type ProdusTest = Omit<Produs, 'id'>",
    check: 'regex',
    pattern: String.raw`type\s+ProdusTest\s*=\s*Omit<\s*Produs\s*,\s*['"]id['"]\s*>`,
    message: "Cerința 2 eșuată: Creează tipul utilitar type ProdusTest = Omit<Produs, 'id'>;.",
    message_en: "Requirement 2 failed: Create utility type ProdusTest = Omit<Produs, 'id'>;.",
    successMessage: "Tipul utilitar ProdusTest = Omit<Produs, 'id'> este definit corect.",
    successMessage_en: "Utility type ProdusTest = Omit<Produs, 'id'> is properly defined.",
  },
  {
    file: 'pom.ts',
    name: '[pom.ts] 3. Clasa abstractă BasePage (Abstractizare)',
    name_en: '[pom.ts] 3. Abstract class BasePage (Abstraction)',
    check: 'regex',
    pattern: String.raw`\babstract\s+class\s+BasePage\b`,
    message: 'Cerința 3 eșuată: Declară clasa părinte folosind abstract class BasePage.',
    message_en: 'Requirement 3 failed: Declare the parent class using abstract class BasePage.',
    successMessage: 'Clasa abstractă BasePage este declarată corect.',
    successMessage_en: 'Abstract class BasePage is properly declared.',
  },
  {
    file: 'pom.ts',
    name: '[pom.ts] 4. Constructor cu proprietatea protected page în BasePage',
    name_en: '[pom.ts] 4. Constructor with protected page in BasePage',
    check: 'regex',
    pattern: String.raw`\babstract\s+class\s+BasePage\b[\s\S]*?(?:constructor\s*\([^)]*\bprotected\s+page\s*:\s*[A-Za-z0-9_<>| &]+|protected\s+page\s*:\s*[A-Za-z0-9_<>| &]+[\s\S]*?constructor\s*\()`,
    message: 'Cerința 4 eșuată: Adaugă în BasePage un constructor care primește și protejează obiectul page (ex: constructor(protected page: any) {}).',
    message_en: 'Requirement 4 failed: Add a constructor in BasePage that accepts and protects page (e.g. constructor(protected page: any) {}).',
    successMessage: 'Proprietatea protected page este încapsulată corect în constructorul BasePage.',
    successMessage_en: 'protected page property is properly encapsulated in BasePage constructor.',
  },
  {
    file: 'pom.ts',
    name: '[pom.ts] 5. Metoda comună navigeazaLa(url: string): void',
    name_en: '[pom.ts] 5. Common method navigeazaLa(url: string): void',
    check: 'regex',
    pattern: String.raw`\bnavig(?:e|he)azaLa\s*\(\s*\w+\s*:\s*string\s*\)\s*:\s*(?:void|Promise<void>)`,
    message: 'Cerința 5 eșuată: Implementează în BasePage metoda comună public navigeazaLa(url: string): void.',
    message_en: 'Requirement 5 failed: Implement common method public navigeazaLa(url: string): void in BasePage.',
    successMessage: 'Metoda comună navigeazaLa(url: string): void este implementată corect.',
    successMessage_en: 'Common method navigeazaLa(url: string): void is properly implemented.',
  },
  {
    file: 'pom.ts',
    name: '[pom.ts] 6. Metoda abstractă obligatorie valideazaIncarcarea(): void',
    name_en: '[pom.ts] 6. Mandatory abstract method valideazaIncarcarea(): void',
    check: 'regex',
    pattern: String.raw`\babstract\s+valideazaIncarcarea\s*\(\s*\)\s*:\s*(?:void|Promise<void>)`,
    message: 'Cerința 6 eșuată: Declară contractul abstract valideazaIncarcarea(): void; în BasePage.',
    message_en: 'Requirement 6 failed: Declare abstract contract abstract valideazaIncarcarea(): void; in BasePage.',
    successMessage: 'Metoda abstractă valideazaIncarcarea(): void impune corect contractul în BasePage.',
    successMessage_en: 'Abstract method valideazaIncarcarea(): void properly enforces the contract in BasePage.',
  },
  {
    file: 'pom.ts',
    name: '[pom.ts] 7. Clasa HomePage extends BasePage (#search-bar privat + valideazaIncarcarea)',
    name_en: '[pom.ts] 7. HomePage extends BasePage (private #search-bar + valideazaIncarcarea)',
    check: 'regex',
    pattern: String.raw`\bclass\s+HomePage\s+extends\s+BasePage\s*\{(?=(?:(?!\bclass\s+)[\s\S])*?\bprivate\s+(?:readonly\s+)?\w+(?:\s*:\s*string)?\s*=\s*['"\x60][^'"\x60]*#search-bar[^'"\x60]*['"\x60])(?=(?:(?!\bclass\s+)[\s\S])*?\bvalideazaIncarcarea\s*\(\s*\))`,
    message: 'Cerința 7 eșuată: Creează class HomePage extends BasePage cu un selector private pentru #search-bar și implementarea metodei valideazaIncarcarea().',
    message_en: 'Requirement 7 failed: Create class HomePage extends BasePage with a private selector for #search-bar and the valideazaIncarcarea() implementation.',
    successMessage: 'Clasa HomePage extinde BasePage, încapsulează #search-bar și implementează valideazaIncarcarea().',
    successMessage_en: 'HomePage extends BasePage, encapsulates #search-bar, and implements valideazaIncarcarea().',
  },
  {
    file: 'pom.ts',
    name: '[pom.ts] 8. Clasa ProductPage extends BasePage (.add-to-cart-btn privat + valideazaIncarcarea)',
    name_en: '[pom.ts] 8. ProductPage extends BasePage (private .add-to-cart-btn + valideazaIncarcarea)',
    check: 'regex',
    pattern: String.raw`\bclass\s+ProductPage\s+extends\s+BasePage\s*\{(?=(?:(?!\bclass\s+)[\s\S])*?\bprivate\s+(?:readonly\s+)?\w+(?:\s*:\s*string)?\s*=\s*['"\x60][^'"\x60]*\.add-to-cart-btn[^'"\x60]*['"\x60])(?=(?:(?!\bclass\s+)[\s\S])*?\bvalideazaIncarcarea\s*\(\s*\))`,
    message: 'Cerința 8 eșuată: Creează class ProductPage extends BasePage cu un selector private pentru .add-to-cart-btn și implementarea metodei valideazaIncarcarea().',
    message_en: 'Requirement 8 failed: Create class ProductPage extends BasePage with a private selector for .add-to-cart-btn and the valideazaIncarcarea() implementation.',
    successMessage: 'Clasa ProductPage extinde BasePage, încapsulează .add-to-cart-btn și implementează valideazaIncarcarea().',
    successMessage_en: 'ProductPage extends BasePage, encapsulates .add-to-cart-btn, and implements valideazaIncarcarea().',
  },
  {
    file: 'pom.ts',
    name: '[pom.ts] 9. Metoda E2E adaugaInCos(produs: ProdusTest) în ProductPage',
    name_en: '[pom.ts] 9. E2E method adaugaInCos(produs: ProdusTest) in ProductPage',
    check: 'regex',
    pattern: String.raw`\bclass\s+ProductPage\s+extends\s+BasePage\s*\{(?:(?!\bclass\s+)[\s\S])*?\badaugaInCos\s*\(\s*(\w+)\s*:\s*ProdusTest\s*\)(?:\s*:\s*(?:void|Promise<void>))?\s*\{[\s\S]*?console\.log\([\s\S]*?\1\.nume`,
    message: 'Cerința 9 eșuată: Adaugă în ProductPage metoda publică adaugaInCos(produs: ProdusTest) care afișează produs.nume în consolă cu console.log.',
    message_en: 'Requirement 9 failed: Add public method adaugaInCos(produs: ProdusTest) in ProductPage that logs produs.nume via console.log.',
    successMessage: 'Metoda adaugaInCos(produs: ProdusTest) folosește contractul ProdusTest și loghează numele produsului.',
    successMessage_en: 'Method adaugaInCos(produs: ProdusTest) enforces the ProdusTest contract and logs the product name.',
  },
]);

const refSolutionS8 = `// --- 1. MATRIȚELE DE DATE ---
interface Produs {
    id: number;
    nume: string;
    pret: number;
    inStoc: boolean;
}
type ProdusTest = Omit<Produs, 'id'>;

// --- 2. CLASA DE BAZĂ (Abstractizare și Moștenire) ---
abstract class BasePage {
    constructor(protected page: any) {}
    public navigeazaLa(url: string): void {
        console.log(\`[Acțiune Comună] Se navighează către: \${url}\`);
    }
    public extrageDateDinPagina<T>(selector: string, dateSimulate: T): T {
        console.log(\`[Extragere Generic] Caut selectorul \${selector}...\`);
        return dateSimulate;
    }
    abstract valideazaIncarcarea(): void;
}

// --- 3. CLASELE DE PAGINĂ (Încapsulare și Polimorfism) ---
class HomePage extends BasePage {
    private selSearchBar = "#search-bar";
    private selSearchBtn = "#btn-search";
    constructor(page: any) {
        super(page);
    }
    public valideazaIncarcarea(): void {
        console.log("[HomePage] Validare: Bara de căutare este vizibilă pe ecran.");
    }
    public cautaProdus(numeProdus: string): void {
        console.log(\`[HomePage] Scriu "\${numeProdus}" în selectorul \${this.selSearchBar}\`);
        console.log(\`[HomePage] Dau click pe \${this.selSearchBtn}\`);
    }
}

class ProductPage extends BasePage {
    private selAddToCartBtn = ".add-to-cart-btn";
    private selCartCounter = ".cart-counter";
    constructor(page: any) {
        super(page);
    }
    public valideazaIncarcarea(): void {
        console.log("[ProductPage] Validare: Butonul 'Adaugă în coș' este prezent și activ.");
    }
    public adaugaInCos(produs: ProdusTest): void {
        console.log(\`[ProductPage] Se adaugă produsul [\${produs.nume}] cu prețul de \${produs.pret} lei.\`);
        console.log(\`[ProductPage] Dau click pe \${this.selAddToCartBtn}\`);
    }
}`;

interface FeedbackItem {
  check: string;
  passed: boolean;
  message: string;
  file?: string;
}

interface ValidationApiResponse {
  status: 'pass' | 'fail';
  score: number;
  feedback: FeedbackItem[];
}

async function validatePom(
  pomCode: string,
  extra: Record<string, unknown> = {}
): Promise<ValidationApiResponse> {
  const req = new NextRequest('http://localhost:3000/api/validate/static', {
    method: 'POST',
    body: JSON.stringify({
      assignmentId: '00000000-0000-0000-0000-000000000008',
      files: { 'pom.ts': pomCode },
      ...extra,
    }),
  });
  const res = await POST(req);
  return res.json() as Promise<ValidationApiResponse>;
}

describe('Module 8 (TS Interfaces & OOP POM) - API Validation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAuthSession).mockResolvedValue({
      user: {
        id: 'usr-1',
        email: 'trainer@qualiadept.eu',
        name: 'George Trainer',
        role: 'TRAINER',
      },
      expires: '2099-01-01T00:00:00.000Z',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr-1',
      email: 'trainer@qualiadept.eu',
      role: 'TRAINER',
      isEnrolled: true,
    } as never);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000008',
      title: 'Sesiunea 8: Structuri Avansate în TS & OOP (Page Object Model)',
      module: 8,
      validationType: 'STATIC',
      validationRules: module8Rules,
    } as never);

    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.submission.count).mockResolvedValue(0);
    vi.mocked(prisma.submission.create).mockResolvedValue({
      id: 'sub-mod8-1',
      status: 'PASS',
      score: 100,
      feedbackJSON: '[]',
    } as never);
  });

  it('TC-01: Reference solution from S8 Chapter 5.3 passes all 9 criteria with 100% score', async () => {
    const data = await validatePom(refSolutionS8);

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback).toHaveLength(9);
    expect(data.feedback.every((f) => f.passed === true)).toBe(true);
  });

  it('TC-02: Alternative idiomatic solution (Mock Page type, field protected page, navigheazaLa, custom param name) passes 100%', async () => {
    const altSolution = `
interface MockPage { goto(url: string): void; }

interface Produs {
  nume: string;
  pret: number;
  inStoc: boolean;
  id: number;
}

type ProdusTest = Omit<Produs, "id">;

abstract class BasePage {
  protected page: MockPage;
  constructor(page: MockPage) {
    this.page = page;
  }
  public navigheazaLa(adresa: string): void {
    this.page.goto(adresa);
  }
  abstract valideazaIncarcarea(): void;
}

class HomePage extends BasePage {
  private readonly searchInput: string = '#search-bar';
  valideazaIncarcarea(): void {
    console.log(this.searchInput);
  }
}

class ProductPage extends BasePage {
  private readonly cartBtn: string = '.add-to-cart-btn';
  valideazaIncarcarea(): void {
    console.log(this.cartBtn);
  }
  public adaugaInCos(item: ProdusTest): void {
    console.log(\`Adaug \${item.nume}\`);
  }
}`;

    const data = await validatePom(altSolution);
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
  });

  it('TC-03: Comment-only starter scaffold fails all 9 rules (0% score)', async () => {
    const starterCommentOnly = `/**
 * interface Produs { id: number; nume: string; pret: number; inStoc: boolean; }
 * type ProdusTest = Omit<Produs, 'id'>;
 * abstract class BasePage { constructor(protected page: any) {} }
 */
// TODO: implement POM classes`;

    const data = await validatePom(starterCommentOnly);
    expect(data.status).toBe('fail');
    expect(data.score).toBe(0);
    expect(data.feedback.every((f) => f.passed === false)).toBe(true);
  });

  it('TC-04: Missing Omit utility type fails ONLY Rule 2', async () => {
    const noOmit = refSolutionS8.replace(
      "type ProdusTest = Omit<Produs, 'id'>;",
      'type ProdusTest = { nume: string; pret: number; inStoc: boolean };'
    );
    const data = await validatePom(noOmit);
    const failedIndices = data.feedback.map((f, i) => (!f.passed ? i + 1 : null)).filter(Boolean);
    expect(failedIndices).toEqual([2]);
  });

  it('TC-05: Using public instead of private selector in HomePage fails ONLY Rule 7', async () => {
    const publicSelector = refSolutionS8.replace(
      'private selSearchBar = "#search-bar";',
      'public selSearchBar = "#search-bar";'
    );
    const data = await validatePom(publicSelector);
    const failedIndices = data.feedback.map((f, i) => (!f.passed ? i + 1 : null)).filter(Boolean);
    expect(failedIndices).toEqual([7]);
  });

  it('TC-06: Selector .add-to-cart-btn declared in HomePage instead of ProductPage fails ONLY Rule 8', async () => {
    const wrongClassSelector = refSolutionS8
      .replace('private selAddToCartBtn = ".add-to-cart-btn";', 'private selAddToCartBtn = ".other-btn";')
      .replace('private selSearchBtn = "#btn-search";', 'private selSearchBtn = ".add-to-cart-btn";');
    const data = await validatePom(wrongClassSelector);
    const failedIndices = data.feedback.map((f, i) => (!f.passed ? i + 1 : null)).filter(Boolean);
    expect(failedIndices).toEqual([8]);
  });

  it('TC-07: adaugaInCos accepting Produs instead of ProdusTest fails ONLY Rule 9', async () => {
    const wrongParamType = refSolutionS8.replace(
      'public adaugaInCos(produs: ProdusTest): void {',
      'public adaugaInCos(produs: Produs): void {'
    );
    const data = await validatePom(wrongParamType);
    const failedIndices = data.feedback.map((f, i) => (!f.passed ? i + 1 : null)).filter(Boolean);
    expect(failedIndices).toEqual([9]);
  });

  it('TC-08: English locale returns English check titles and success messages', async () => {
    const data = await validatePom(refSolutionS8, { locale: 'en' });

    expect(data.status).toBe('pass');
    expect(data.feedback[0].check).toBe('[pom.ts] 1. Data interface Produs (id, nume, pret, inStoc)');
    expect(data.feedback[0].message).toContain('properly defined');
    expect(data.feedback[8].check).toBe('[pom.ts] 9. E2E method adaugaInCos(produs: ProdusTest) in ProductPage');
  });
});
