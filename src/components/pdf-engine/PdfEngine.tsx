'use client';

import React from 'react';
import { Font, StyleSheet } from '@react-pdf/renderer';

// Register Inter font from Google Fonts for better typography
Font.register({
    family: 'Inter',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
            fontWeight: 'normal',
        },
        {
            src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2',
            fontWeight: 'bold',
        },
    ],
});

// Hyphenation callback to improve text wrapping
Font.registerHyphenationCallback((word) => [word]);

// Common styles that can be used across templates
export const commonStyles = StyleSheet.create({
    page: {
        paddingTop: 35,
        paddingBottom: 65,
        paddingHorizontal: 35,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
        borderBottomStyle: 'solid',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    text: {
        fontSize: 10,
        marginBottom: 10,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'grey',
        fontSize: 8,
    },
    watermark: {
        position: 'absolute',
        top: '30%',
        left: '25%',
        width: '50%',
        height: '50%',
        opacity: 0.1,
        transform: 'rotate(-45deg)',
        zIndex: -1,
    },
});

export const PdfEngine = {
    styles: commonStyles,
    // Utility to create a style object compatible with react-pdf
    createStyles: (styles: any) => StyleSheet.create(styles),
};
