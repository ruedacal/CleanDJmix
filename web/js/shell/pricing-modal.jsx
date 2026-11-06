import { ShellIcons as Icons } from './icons.jsx';

const { useState, useEffect, useRef } = React;

const PLANS = [
    {
        id: 'free',
        name: 'Free / Demo',
        tagline: 'Para probar el flujo en cabina',
        price: { monthly: '0', annual: '0' },
        unit: { monthly: '€', annual: '€' },
        note: { monthly: 'Sin tarjeta', annual: 'Sin tarjeta' },
        features: [
            'Auditoría de 30 pistas por sesión',
            'Diagnóstico visual FFT de fidelidad: detecta cortes a 16 / 18 / 20 kHz en FLAC falsos o reescalados',
            'Visor básico de cues y waveform',
        ],
        cta: 'Try Free in Booth',
        variant: 'ghost',
    },
    {
        id: 'pro',
        name: 'DJ Pro',
        tagline: 'La cabina completa, sin límites',
        price: { monthly: '9,99', annual: '89' },
        unit: { monthly: '€ / mes', annual: '€ / año' },
        note: { monthly: 'Facturado mensualmente', annual: 'Equivale a 7,42 € / mes' },
        features: [
            'Auditoría ilimitada de biblioteca',
            'Ingesta y descarga masiva SuperFLAC Lossless (16 / 24-bit)',
            'Purga y reemplazo de pistas de baja calidad en un clic',
            'Radar acústico en vivo para cabina',
            'Exportación nativa a pendrives Rekordbox, Serato DJ Pro y Traktor',
            'AI Copilot y optimizador armónico de sets Camelot',
        ],
        cta: 'Get Pro License',
        variant: 'primary',
        featured: true,
    },
    {
        id: 'lifetime',
        name: 'Founder / Lifetime',
        tagline: 'Un solo pago, para siempre',
        price: { monthly: '189', annual: '189' },
        unit: { monthly: '€ pago único', annual: '€ pago único' },
        note: { monthly: 'Cero suscripciones', annual: 'Cero suscripciones' },
        features: [
            'Pago único, sin suscripciones (el modelo que prefieren los DJs de Mixed In Key y Ableton)',
            'Acceso vitalicio a DJ Pro + 12–24 meses de actualizaciones garantizadas',
            'Soporte VIP prioritario para club y festival',
        ],
        cta: 'Buy Lifetime License',
        variant: 'outline',
    },
];

export function PricingModal({ isOpen, onClose, onSelectPlan }) {
    const [billing, setBilling] = useState('annual');
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        dialogRef.current?.focus();
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="ws-pricing-backdrop" onClick={onClose}>
            <div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pricing-title"
                className="ws-pricing custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" onClick={onClose} aria-label="Cerrar precios" className="ws-glass-icon ws-pricing-close">
                    <Icons.Close size={14} />
                </button>

                <header className="ws-pricing-head">
                    <span className="ws-glass-kicker">Licencias BeatWave Pro</span>
                    <h2 id="pricing-title" className="ws-pricing-title text-balance">Elige tu nivel de cabina</h2>
                    <p className="ws-pricing-sub text-pretty">Audita, limpia y exporta tu biblioteca con fidelidad de club. Cambia o cancela cuando quieras.</p>

                    <div className="ws-seg ws-pricing-toggle" role="group" aria-label="Periodo de facturación">
                        <button type="button" aria-pressed={billing === 'monthly'} className={`ws-seg-btn ${billing === 'monthly' ? 'ws-seg-on' : ''}`} onClick={() => setBilling('monthly')}>Mensual</button>
                        <button type="button" aria-pressed={billing === 'annual'} className={`ws-seg-btn ${billing === 'annual' ? 'ws-seg-on' : ''}`} onClick={() => setBilling('annual')}>
                            Anual <span className="ws-pricing-save">-25%</span>
                        </button>
                    </div>
                </header>

                <div className="ws-pricing-grid">
                    {PLANS.map((plan) => (
                        <article key={plan.id} className={`ws-plan ${plan.featured ? 'is-featured' : ''}`} aria-label={plan.name}>
                            {plan.featured && <span className="ws-plan-flag"><Icons.Star size={11} /> Recomendado en cabina</span>}
                            <div className="flex flex-col gap-1">
                                <h3 className="ws-plan-name">{plan.name}</h3>
                                <p className="ws-plan-tag">{plan.tagline}</p>
                            </div>
                            <div className="ws-plan-price">
                                <span className="ws-plan-amount">{plan.price[billing]}</span>
                                <span className="ws-plan-unit">{plan.unit[billing]}</span>
                            </div>
                            <p className="ws-plan-note">{plan.note[billing]}</p>
                            <button
                                type="button"
                                className={`ws-btn ws-btn-${plan.variant} w-full justify-center h-10`}
                                onClick={() => onSelectPlan?.(plan.id, billing)}
                            >
                                {plan.id === 'lifetime' && <Icons.Infinity size={14} />}
                                {plan.cta}
                            </button>
                            <ul className="ws-plan-features">
                                {plan.features.map((f) => (
                                    <li key={f}><Icons.Check size={14} className="ws-plan-check" aria-hidden="true" /><span>{f}</span></li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>

                <p className="ws-pricing-foot">Precios en euros con IVA incluido. Las licencias se vinculan a tu cuenta BeatWave.</p>
            </div>
        </div>
    );
}
