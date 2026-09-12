import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';

interface CertificateProps {
  studentName: string;
  courseName?: string;
  issueDate: string;
  certificateId: string;
  logoUrl?: string;
  qrCodeUrl?: string;
  mentorName?: string;
  companyName?: string;
  hoursSpent?: number;
  sessionCount?: number;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 18,
    fontFamily: 'Helvetica',
  },
  outerBorder: {
    borderWidth: 1.5,
    borderColor: '#0f172a', // Navy / Dark slate outer frame
    padding: 5,
    height: '100%',
    borderRadius: 8,
  },
  innerBorder: {
    borderWidth: 2.5,
    borderColor: '#d97706', // Gold / Amber inner accent
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 20,
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
    alignItems: 'flex-start',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 130,
    height: 38,
    objectFit: 'contain',
  },
  logoTextQuali: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  logoTextAdept: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669',
  },
  metaTopRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  metaCertId: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  metaDate: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  centerContent: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 4,
  },
  mainTitleRo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  mainTitleEn: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#d97706',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  presentedToText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  nameContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  nameAccentLine: {
    width: 260,
    height: 1.5,
    backgroundColor: '#d97706',
    marginVertical: 3,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b45309', // Rich gold/bronze
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subTextRo: {
    fontSize: 8.5,
    color: '#334155',
    marginTop: 5,
  },
  subTextEn: {
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 1,
  },
  pillContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 22,
    marginVertical: 6,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  durationRo: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  durationEn: {
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    paddingTop: 8,
  },
  qrContainer: {
    alignItems: 'center',
    width: 100,
  },
  qrImage: {
    width: 48,
    height: 48,
  },
  qrLabel: {
    fontSize: 6.5,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  sealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOuterCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  sealInnerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#d97706',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealTextTop: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#d97706',
    letterSpacing: 1,
  },
  sealTextBottom: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#d97706',
    letterSpacing: 1,
  },
  sealSubtitle: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1,
    marginTop: 3,
  },
  signatureContainer: {
    alignItems: 'flex-end',
    width: 220,
  },
  signatureVisual: {
    height: 28,
    marginBottom: 2,
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  signatureTextScript: {
    fontSize: 18,
    color: '#0284c7',
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 2,
    marginRight: 25,
  },
  signatureLine: {
    width: 190,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    marginBottom: 3,
  },
  mentorNameText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  mentorRoleText: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 1,
  },
});

export default function CertificateTemplate({
  studentName,
  courseName = 'TypeScript & Playwright',
  issueDate,
  certificateId,
  logoUrl,
  qrCodeUrl,
  mentorName = 'DATCU GEORGE-CRISTIAN',
  companyName = 'QUALIADEPT',
  hoursSpent = 50,
  sessionCount = 21,
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

              <View style={styles.metaTopRight}>
                <Text style={styles.metaCertId}>ID: {certificateId}</Text>
                <Text style={styles.metaDate}>Data / Date: {issueDate}</Text>
              </View>
            </View>

            {/* Center Content Section */}
            <View style={styles.centerContent}>
              <Text style={styles.mainTitleRo}>CERTIFICAT DE ABSOLVIRE</Text>
              <Text style={styles.mainTitleEn}>CERTIFICATE OF COMPLETION</Text>

              <Text style={styles.presentedToText}>
                Se acordă prin prezenta lui / This is proudly presented to
              </Text>

              {/* Student Name in Gold with double accent lines */}
              <View style={styles.nameContainer}>
                <View style={styles.nameAccentLine} />
                <Text style={styles.studentName}>{studentName}</Text>
                <View style={styles.nameAccentLine} />
              </View>

              <Text style={styles.subTextRo}>
                pentru absolvirea cu succes a programului intensiv de mentorat și pregătire practică:
              </Text>
              <Text style={styles.subTextEn}>
                for successfully completing the intensive mentorship program:
              </Text>

              {/* Program Pill Badge */}
              <View style={styles.pillContainer}>
                <Text style={styles.pillText}>{courseName}</Text>
              </View>

              {/* Duration Text */}
              <Text style={styles.durationRo}>
                Durată totală: {hoursSpent} ore ({sessionCount} sesiuni x 2.5h) de consultanță live și practică aplicată
              </Text>
              <Text style={styles.durationEn}>
                Total duration: {hoursSpent} hours ({sessionCount} sessions x 2.5h) of live mentorship and hands-on practice
              </Text>
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
                <Text style={styles.qrLabel}>Scan to verify authenticity</Text>
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
                {/* Stylized Signature */}
                <Svg width="70" height="26" viewBox="0 0 100 40" style={{ marginBottom: 2, marginRight: 25 }}>
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
                <View style={styles.signatureLine} />
                <Text style={styles.mentorNameText}>{mentorName} PERSOANĂ FIZICĂ AUTORIZATĂ</Text>
                <Text style={styles.mentorRoleText}>Lead Mentor &amp; Provider / {companyName}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
