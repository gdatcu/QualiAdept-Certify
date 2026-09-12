import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Font } from '@react-pdf/renderer';
import path from 'path';

// Register Latin-Extended Roboto fonts to ensure 100% crisp Romanian diacritics (ă, î, â, ș, ț, Ă, Î, Â, Ș, Ț)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'),
      fontWeight: 700,
    },
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Italic.ttf'),
      fontWeight: 400,
      fontStyle: 'italic',
    },
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-BoldItalic.ttf'),
      fontWeight: 700,
      fontStyle: 'italic',
    },
  ],
});

interface CertificateProps {
  studentName: string;
  courseName?: string;
  issueDate: string;
  certificateId: string;
  logoUrl?: string;
  qrCodeUrl?: string;
  signatureUrl?: string;
  mentorName?: string;
  companyName?: string;
  passedModulesCount?: number;
  totalModulesCount?: number;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 16,
    fontFamily: 'Roboto',
  },
  outerBorder: {
    borderWidth: 1.5,
    borderColor: '#0f172a', // Navy slate outer frame
    padding: 4,
    height: '100%',
    borderRadius: 8,
  },
  innerBorder: {
    borderWidth: 2,
    borderColor: '#d97706', // Gold / Amber inner accent
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 18,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 32,
    objectFit: 'contain',
  },
  logoTextQuali: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0284c7',
  },
  logoTextAdept: {
    fontSize: 20,
    fontWeight: 700,
    color: '#059669',
  },
  topBadgeContainer: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  topBadgeText: {
    fontSize: 7,
    fontWeight: 700,
    color: '#334155',
    letterSpacing: 1,
  },
  metaTopRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  metaCertId: {
    fontSize: 8,
    fontWeight: 700,
    color: '#1e293b',
  },
  metaDate: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 1,
  },
  centerContent: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 2,
  },
  mainTitleRo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: 1.5,
  },
  mainTitleEn: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#d97706',
    letterSpacing: 2,
    marginTop: 2,
  },
  subtitleValidation: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  presentedToText: {
    fontSize: 8,
    color: '#475569',
    marginTop: 5,
    fontStyle: 'italic',
  },
  nameContainer: {
    alignItems: 'center',
    marginVertical: 2,
  },
  nameAccentLine: {
    width: 240,
    height: 1.2,
    backgroundColor: '#d97706',
    marginVertical: 2,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#b45309', // Rich bronze gold
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  subTextRo: {
    fontSize: 7.8,
    color: '#334155',
    marginTop: 3,
    maxWidth: 500,
    lineHeight: 1.3,
  },
  subTextEn: {
    fontSize: 7.2,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 1,
    maxWidth: 500,
  },
  trackBadge: {
    backgroundColor: '#0f172a',
    paddingVertical: 3.5,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 5,
    marginBottom: 4,
    alignItems: 'center',
  },
  trackBadgeText: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#f8fafc',
    letterSpacing: 0.8,
  },
  skillsSection: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 3,
  },
  skillsHeader: {
    fontSize: 7,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 2,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  skillsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  skillsCol: {
    width: '48%',
  },
  skillItem: {
    fontSize: 6.8,
    color: '#334155',
    lineHeight: 1.3,
    marginBottom: 1,
  },
  engineProofRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  engineProofText: {
    fontSize: 7,
    fontWeight: 700,
    color: '#059669', // Emerald verified
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    paddingTop: 4,
  },
  qrContainer: {
    alignItems: 'center',
    width: 90,
  },
  qrImage: {
    width: 44,
    height: 44,
  },
  qrLabel: {
    fontSize: 5.8,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  sealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOuterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  sealInnerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d97706',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealTextTop: {
    fontSize: 5.5,
    fontWeight: 700,
    color: '#d97706',
    letterSpacing: 0.8,
  },
  sealTextBottom: {
    fontSize: 5.5,
    fontWeight: 700,
    color: '#d97706',
    letterSpacing: 0.8,
  },
  sealSubtitle: {
    fontSize: 5.5,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  signatureContainer: {
    alignItems: 'flex-end',
    width: 200,
  },
  signatureImage: {
    height: 26,
    maxWidth: 130,
    objectFit: 'contain',
    marginBottom: 2,
    marginRight: 15,
  },
  signatureLine: {
    width: 170,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    marginBottom: 2,
  },
  mentorNameText: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#0f172a',
  },
  mentorRoleText: {
    fontSize: 6.8,
    color: '#64748b',
    marginTop: 0.5,
  },
});

export default function CertificateTemplate({
  studentName,
  courseName = 'QA Automation Engineer — TypeScript & Playwright',
  issueDate,
  certificateId,
  logoUrl,
  qrCodeUrl,
  signatureUrl,
  mentorName = 'DATCU GEORGE-CRISTIAN',
  companyName = 'QUALIADEPT',
  passedModulesCount = 20,
  totalModulesCount = 20,
}: CertificateProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Top Header Row */}
            <View style={styles.topRow}>
              <View style={styles.logoContainer}>
                {logoUrl ? (
                  <Image src={logoUrl} style={styles.logoImage} />
                ) : (
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.logoTextQuali}>Quali</Text>
                    <Text style={styles.logoTextAdept}>Adept</Text>
                  </View>
                )}
              </View>

              <View style={styles.topBadgeContainer}>
                <Text style={styles.topBadgeText}>AUTOMATED QUALITY ASSESSMENT • CERTIFY.QUALIADEPT.EU</Text>
              </View>

              <View style={styles.metaTopRight}>
                <Text style={styles.metaCertId}>ID: {certificateId}</Text>
                <Text style={styles.metaDate}>Data / Date: {issueDate}</Text>
              </View>
            </View>

            {/* Center Content Section */}
            <View style={styles.centerContent}>
              <Text style={styles.mainTitleRo}>CERTIFICAT DE COMPETENȚĂ TEHNICĂ</Text>
              <Text style={styles.mainTitleEn}>CERTIFICATE OF TECHNICAL MASTERY &amp; SKILLS</Text>
              <Text style={styles.subtitleValidation}>
                VALIDARE AUTOMATĂ DE COD &amp; QA AUTOMATION • AUTOMATED CODE VALIDATION &amp; ASSESSMENT
              </Text>

              <Text style={styles.presentedToText}>
                Se certifică prin prezenta că / This is proudly certified to:
              </Text>

              {/* Student Name in Gold with double accent lines */}
              <View style={styles.nameContainer}>
                <View style={styles.nameAccentLine} />
                <Text style={styles.studentName}>{studentName}</Text>
                <View style={styles.nameAccentLine} />
              </View>

              <Text style={styles.subTextRo}>
                a promovat cu succes toate evaluările practice de cod și a demonstrat stăpânirea competențelor avansate de QA Automation, validate automat pe platforma QualiAdept Certify.
              </Text>
              <Text style={styles.subTextEn}>
                has successfully passed all practical code evaluations and demonstrated advanced QA Automation engineering competencies, fully verified by the QualiAdept Certify platform.
              </Text>

              {/* Specialization Track Badge */}
              <View style={styles.trackBadge}>
                <Text style={styles.trackBadgeText}>{courseName}</Text>
              </View>

              {/* Verified Competencies Matrix */}
              <View style={styles.skillsSection}>
                <Text style={styles.skillsHeader}>COMPETENȚE PRACTICE CERTIFICATE / CERTIFIED COMPETENCIES</Text>
                <View style={styles.skillsGrid}>
                  <View style={styles.skillsCol}>
                    <Text style={styles.skillItem}>• DOM Architecture &amp; Robust Locators Strategy (data-testid, CSS)</Text>
                    <Text style={styles.skillItem}>• Playwright E2E Test Suite Development &amp; Async Assertions</Text>
                    <Text style={styles.skillItem}>• Page Object Model (POM) Architectural Design &amp; Maintenance</Text>
                  </View>
                  <View style={styles.skillsCol}>
                    <Text style={styles.skillItem}>• API Testing, Network Mocking, Interception &amp; Fixtures</Text>
                    <Text style={styles.skillItem}>• Asynchronous Automation, Auto-waiting &amp; Flakiness Prevention</Text>
                    <Text style={styles.skillItem}>• CI/CD Pipeline Automation &amp; GitHub Actions Quality Gates</Text>
                  </View>
                </View>
              </View>

              {/* Engine Proof Bar */}
              <View style={styles.engineProofRow}>
                <Text style={styles.engineProofText}>
                  ✔ Validare Automată: {passedModulesCount}/{totalModulesCount} Suite de Teste Promovate (Scor 100%) • Motor de Evaluare: QualiAdept Engine
                </Text>
              </View>
            </View>

            {/* Footer Row */}
            <View style={styles.footerRow}>
              {/* Left Column: QR Code */}
              <View style={styles.qrContainer}>
                {qrCodeUrl ? (
                  <Image src={qrCodeUrl} style={styles.qrImage} />
                ) : (
                  <View style={[styles.qrImage, { backgroundColor: '#f1f5f9' }]} />
                )}
                <Text style={styles.qrLabel}>Scan to verify authenticity &amp; student portfolio</Text>
              </View>

              {/* Center Column: Official Verification Seal */}
              <View style={styles.sealContainer}>
                <View style={styles.sealOuterCircle}>
                  <View style={styles.sealInnerCircle}>
                    <Text style={styles.sealTextTop}>SEAL</Text>
                    <Text style={styles.sealTextBottom}>VERIFIED</Text>
                  </View>
                </View>
                <Text style={styles.sealSubtitle}>OFFICIAL VERIFIED</Text>
              </View>

              {/* Right Column: Signature Block */}
              <View style={styles.signatureContainer}>
                {signatureUrl ? (
                  <Image src={signatureUrl} style={styles.signatureImage} />
                ) : (
                  <Svg width="65" height="24" viewBox="0 0 100 40" style={{ marginBottom: 2, marginRight: 20 }}>
                    <Path
                      d="M10 25 C 20 10, 30 35, 40 15 C 50 5, 55 30, 70 20 C 80 15, 85 28, 95 22"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <Path
                      d="M35 18 L 85 18"
                      stroke="#0284c7"
                      strokeWidth="1.8"
                      fill="none"
                    />
                  </Svg>
                )}
                <View style={styles.signatureLine} />
                <Text style={styles.mentorNameText}>{mentorName}</Text>
                <Text style={styles.mentorRoleText}>Lead Mentor &amp; Provider / {companyName}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
