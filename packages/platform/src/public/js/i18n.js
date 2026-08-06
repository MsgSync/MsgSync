const translations = {
    en: {
        dashboard: 'Dashboard',
        analytics: 'Analytics',
        clients: 'Clients',
        campaigns: 'Campaigns',
        billing: 'Billing',
        coverage: 'Coverage',
        routing: 'Routing',
        security: 'Security',
        verification: 'Verification',
        branding: 'Branding',
        total_revenue: 'Total Revenue',
        carrier_cost: 'Carrier Cost',
        net_profit: 'Net Profit',
        success_rate: 'Success Rate',
        live_traffic: 'Live Global Traffic',
        delivery_volume: 'Delivery Volume (24h)',
        sentiment_analysis: 'AI Sentiment Analysis',
        engagement_score: 'Campaign Engagement Score'
    },
    es: {
        dashboard: 'Panel',
        analytics: 'Analítica',
        clients: 'Clientes',
        campaigns: 'Campañas',
        billing: 'Facturación',
        coverage: 'Cobertura',
        routing: 'Enrutamiento',
        security: 'Seguridad',
        verification: 'Verificación',
        branding: 'Marca',
        total_revenue: 'Ingresos Totales',
        carrier_cost: 'Costo del Proveedor',
        net_profit: 'Beneficio Neto',
        success_rate: 'Tasa de Éxito',
        live_traffic: 'Tráfico Global en Vivo',
        delivery_volume: 'Volumen de Entrega (24h)',
        sentiment_analysis: 'Análisis de Sentimiento IA',
        engagement_score: 'Puntuación de Participación'
    },
    fr: {
        dashboard: 'Tableau de Bord',
        analytics: 'Analytique',
        clients: 'Clients',
        campaigns: 'Campagnes',
        billing: 'Facturation',
        coverage: 'Couverture',
        routing: 'Routage',
        security: 'Sécurité',
        verification: 'Vérification',
        branding: 'Marque',
        total_revenue: 'Revenu Total',
        carrier_cost: 'Coût du Transporteur',
        net_profit: 'Bénéfice Net',
        success_rate: 'Taux de Réussite',
        live_traffic: 'Trafic Mondial en Direct',
        delivery_volume: 'Volume de Livraison (24h)',
        sentiment_analysis: 'Analyse de Sentiment IA',
        engagement_score: "Score d'Engagement"
    }
};

function i18n(key) {
    const lang = localStorage.getItem('msgsync_lang') || 'en';
    return translations[lang][key] || translations['en'][key] || key;
}

function setLanguage(lang) {
    localStorage.setItem('msgsync_lang', lang);
    location.reload();
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.innerText = i18n(el.getAttribute('data-i18n'));
    });
});
