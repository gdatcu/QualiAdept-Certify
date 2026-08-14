import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface CertificateProps {
  studentName: string;
  courseName?: string;
  issueDate: string;
  certificateId: string;
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#09090b', // Dark slate background matching platform theme
    color: '#f4f4f5',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  outerBorder: {
    borderWidth: 3,
    borderColor: '#0284c7', // Sky blue outer accent
    padding: 10,
    height: '100%',
    borderRadius: 8,
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: '#334155', // Slate divider
    padding: 30,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#0f172a', // Deep indigo slate inner fill
    position: 'relative',
  },
  topLeftLogo: {
    position: 'absolute',
    top: 22,
    left: 25,
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  brandName: {
    fontSize: 14,
    color: '#38bdf8', // Sky 400
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: 'extrabold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 6,
  },
  divider: {
    width: 140,
    height: 2,
    backgroundColor: '#38bdf8',
    marginTop: 6,
    marginBottom: 12,
  },
  certifyText: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 28,
    color: '#38bdf8', // Sky blue gradient feel
    fontWeight: 'bold',
    marginVertical: 10,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 1.6,
    marginVertical: 10,
  },
  courseTitle: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: 'bold',
    marginVertical: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerColLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  footerColRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: '#e2e8f0',
    fontWeight: 'bold',
  },
  signatureLine: {
    width: 140,
    borderTopWidth: 1,
    borderTopColor: '#38bdf8',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 11,
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  signatureRole: {
    fontSize: 9,
    color: '#38bdf8',
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6 12',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 12,
    backgroundColor: '#0369a1',
  },
  badgeText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default function CertificateTemplate({
  studentName,
  courseName = 'QA Automation Engineering Bootcamp',
  issueDate,
  certificateId,
  logoUrl,
}: CertificateProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {logoUrl ? <Image src={logoUrl} style={styles.topLeftLogo} /> : null}

            {/* Top Header */}
            <View style={styles.header}>
              <Text style={styles.brandName}>QualiAdept Certify Platform</Text>
              <Text style={styles.title}>Certificate of Completion</Text>
              <View style={styles.divider} />
              <Text style={styles.certifyText}>This certifies that</Text>
              <Text style={styles.studentName}>{studentName}</Text>
            </View>

            {/* Middle Description */}
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.description}>
                has successfully completed 100% of practical hands-on assessments, static DOM evaluations,
                and dynamic Playwright E2E test suite executions for
              </Text>
              <Text style={styles.courseTitle}>{courseName}</Text>
            </View>

            {/* Bottom Footer Section */}
            <View style={styles.footerRow}>
              {/* Left Column: Metadata */}
              <View style={styles.footerColLeft}>
                <Text style={styles.metaLabel}>Certificate ID</Text>
                <Text style={styles.metaValue}>{certificateId}</Text>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>Issue Date</Text>
                <Text style={styles.metaValue}>{issueDate}</Text>
              </View>

              {/* Center Verification Badge */}
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>VERIFIED CREDENTIAL</Text>
              </View>

              {/* Right Column: Lead Trainer Signature */}
              <View style={styles.footerColRight}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>George Datcu</Text>
                <Text style={styles.signatureRole}>Lead Trainer &amp; Architect</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
