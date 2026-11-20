import { ShellIcons as Icons } from './icons.jsx';

const { useState, useEffect, useRef } = React;

export function RegisterFlowModal({ 
    isOpen, 
    onClose, 
    onSuccessRegister,
    initialPlan = 'pro',
    initialBilling = 'annual'
}) {
    const [step, setStep] = useState(1); // 1: Datos DJ | 2: Planes | 3: Pasarela de Pago | 4: Éxito
    
    // Paso 1: Datos de Registro
    const [alias, setAlias] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [software, setSoftware] = useState('serato');
    const [step1Error, setStep1Error] = useState('');

    // Paso 2: Plan & Facturación
    const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'pro');
    const [billingCycle, setBillingCycle] = useState(initialBilling || 'annual');

    // Paso 3: Pasarela de Pago
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'gpay' | 'applepay' | 'paypal'
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingZip, setBillingZip] = useState('');
    const [billingCountry, setBillingCountry] = useState('España');
    const [taxId, setTaxId] = useState('');
    const [saveMethodForRenewals, setSaveMethodForRenewals] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const dialogRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        setStep(1);
        setStep1Error('');
        setPaymentError('');
        setIsProcessing(false);
        const onKey = (e) => { if (e.key === 'Escape' && !isProcessing) onClose?.(); };
        document.addEventListener('keydown', onKey);
        dialogRef.current?.focus();
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen]);

    if (!isOpen) return null;

    // Precios por plan
    const getPlanPrice = () => {
        if (selectedPlan === 'free') return 0;
        if (selectedPlan === 'lifetime') return 189;
        return billingCycle === 'annual' ? 89 : 9.99;
    };

    const price = getPlanPrice();
    const vat = selectedPlan === 'free' ? 0 : Number((price * 0.21).toFixed(2));
    const total = selectedPlan === 'free' ? 0 : Number((price + vat).toFixed(2));

    // Formateador de tarjeta de crédito
    const handleCardNumberChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
        const parts = val.match(/.{1,4}/g);
        setCardNumber(parts ? parts.join(' ') : val);
    };

    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 2) {
            val = val.slice(0, 2) + '/' + val.slice(2);
        }
        setCardExpiry(val);
    };

    const handleValidateStep1 = (e) => {
        e.preventDefault();
        if (!alias.trim()) {
            setStep1Error('Por favor introduce tu Nombre o Alias DJ.');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            setStep1Error('Introduce un correo electrónico profesional válido.');
            return;
        }
        if (!password || password.length < 6) {
            setStep1Error('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setStep1Error('');
        setCardHolder(fullName.trim() || alias.trim());
        setStep(2);
    };

    const handlePlanSelected = (planId) => {
        setSelectedPlan(planId);
        if (planId === 'free') {
            // Free no requiere pasarela de pago, activar directamente
            setStep(4);
            triggerSuccessRegistration({ planId: 'free', billingCycle });
        } else {
            setStep(3);
        }
    };

    const handleProcessPayment = () => {
        setPaymentError('');
        if (paymentMethod === 'card') {
            const rawCard = cardNumber.replace(/\s/g, '');
            if (rawCard.length < 15) {
                setPaymentError('Por favor introduce un número de tarjeta válido (16 dígitos).');
                return;
            }
            if (cardExpiry.length < 5) {
                setPaymentError('Fecha de caducidad incompleta (MM/AA).');
                return;
            }
            if (cardCvc.length < 3) {
                setPaymentError('Código CVC incompleto (3 dígitos).');
                return;
            }
        }

        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setStep(4);
            triggerSuccessRegistration({ 
                planId: selectedPlan, 
                billingCycle, 
                paymentMethod, 
                cardLast4: paymentMethod === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : 'APPLE/GPAY' 
            });
        }, 1200);
    };

    const triggerSuccessRegistration = (details) => {
        const newProfile = {
            alias: alias || 'DJ Alex BeatWave',
            fullName: fullName || alias || 'DJ Alex',
            email: email || 'dj@beatwave.pro',
            djSoftware: software === 'serato' ? 'Serato DJ Pro' : software === 'rekordbox' ? 'Rekordbox' : software === 'traktor' ? 'Traktor Pro' : 'VirtualDJ Pro',
            plan: details.planId === 'free' ? 'FREE STARTER' : details.planId === 'lifetime' ? 'FOUNDER LIFETIME' : 'DJ PRO CLUB VIP',
            billingCycle: details.billingCycle,
            paymentMethod: details.paymentMethod || 'card',
            cardLast4: details.cardLast4 || '4242',
            address: billingAddress,
            city: billingCity,
            country: billingCountry,
            taxId: taxId
        };
        try {
            localStorage.setItem('bw_user_profile', JSON.stringify(newProfile));
        } catch (e) {}
        if (onSuccessRegister) onSuccessRegister(newProfile);
    };

    return (
        <div 
            className="fixed inset-0 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn"
            style={{ zIndex: 99999 }}
        >
            <div 
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-2xl bg-[#090a16] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-gray-200 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera & Barra de Progreso de Pasos */}
                <div className="p-5 sm:p-6 border-b border-zinc-800/80 bg-[#0d0e20] shrink-0">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-sm shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                                🎧
                            </span>
                            <div>
                                <h2 className="text-base sm:text-lg font-mono font-black uppercase text-white tracking-wider flex items-center gap-2">
                                    Registro de Cabina <span className="text-cyan-400 text-xs sm:text-sm">BEATWAVE PRO</span>
                                </h2>
                                <p className="text-xs text-zinc-400 font-mono">Alta de licencia profesional y pasarela de pago segura</p>
                            </div>
                        </div>

                        {!isProcessing && step < 4 && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-mono text-xs border border-zinc-700/60 transition-colors cursor-pointer"
                                title="Cerrar registro (ESC)"
                            >
                                <Icons.Close size={14} />
                            </button>
                        )}
                    </div>

                    {/* Step Wizard Indicator */}
                    <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px] sm:text-xs">
                        {[
                            { num: 1, label: '1. Datos DJ' },
                            { num: 2, label: '2. Planes' },
                            { num: 3, label: '3. Pasarela' },
                            { num: 4, label: '4. Cabina' },
                        ].map((s) => (
                            <div 
                                key={s.num} 
                                className={`py-1.5 px-2 rounded-xl border transition-all ${
                                    step === s.num 
                                        ? 'bg-cyan-500 text-black border-cyan-400 font-black shadow-[0_0_12px_rgba(6,182,212,0.5)]' 
                                        : step > s.num 
                                        ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 font-bold' 
                                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                                }`}
                            >
                                <span>{step > s.num ? `✓ ${s.label.split('. ')[1]}` : s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CUERPO DEL PASO */}
                <div className="p-5 sm:p-7 overflow-y-auto max-h-[75vh]">
                    {/* PASO 1: DATOS DE REGISTRO */}
                    {step === 1 && (
                        <form onSubmit={handleValidateStep1} className="flex flex-col gap-4">
                            {step1Error && (
                                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
                                    <Icons.Warning size={14} className="shrink-0 text-red-400" />
                                    <span>{step1Error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                                        Nombre Artístico / Alias DJ *
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ej. DJ Alex BeatWave"
                                        value={alias}
                                        onChange={(e) => setAlias(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/90 border border-zinc-700/80 focus:border-cyan-400 text-white font-mono text-xs outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                                        Nombre Completo Titular
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Alejandro Rueda"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/90 border border-zinc-700/80 focus:border-cyan-400 text-white font-mono text-xs outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                                        Correo Electrónico DJ *
                                    </label>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="alex@beatwave.pro"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/90 border border-zinc-700/80 focus:border-cyan-400 text-white font-mono text-xs outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                                        Contraseña de Acceso *
                                    </label>
                                    <input 
                                        type="password" 
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/90 border border-zinc-700/80 focus:border-cyan-400 text-white font-mono text-xs outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                                    Software Principal de Cabina
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                                    {[
                                        { id: 'serato', label: 'Serato DJ Pro', color: '#00d1e8' },
                                        { id: 'rekordbox', label: 'Rekordbox', color: '#0052ff' },
                                        { id: 'traktor', label: 'Traktor Pro', color: '#ff5500' },
                                        { id: 'virtualdj', label: 'VirtualDJ Pro', color: '#10b981' },
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setSoftware(s.id)}
                                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                                                software === s.id 
                                                    ? 'bg-zinc-900 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                                                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                                            }`}
                                        >
                                            <span style={{ color: s.color }}>● </span>
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                                <span className="text-[11px] text-zinc-500 font-mono">
                                    Tus datos quedan cifrados en tu dispositivo bajo GDPR/LOPD.
                                </span>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer flex items-center gap-2"
                                >
                                    <span>Continuar a Selección de Plan</span>
                                    <Icons.ChevronRight size={14} />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* PASO 2: SELECCIÓN DE PLAN */}
                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <h3 className="font-mono font-black text-sm text-white uppercase">Elige tu Nivel de Licencia</h3>
                                    <p className="text-xs text-zinc-400 font-mono">Cambia de plan o cancela en cualquier momento con un clic.</p>
                                </div>

                                {/* Toggle Mensual / Anual */}
                                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-3 py-1 rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        Mensual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('annual')}
                                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${billingCycle === 'annual' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <span>Anual</span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-black">-25%</span>
                                    </button>
                                </div>
                            </div>

                            {/* Cards de Planes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Plan Free */}
                                <div 
                                    onClick={() => setSelectedPlan('free')}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                        selectedPlan === 'free'
                                            ? 'bg-zinc-900/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                >
                                    <div>
                                        <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Iniciación</span>
                                        <h4 className="font-mono font-black text-sm text-white mt-0.5">Free Demo</h4>
                                        <div className="text-2xl font-mono font-black text-white my-2">0 €</div>
                                        <ul className="text-[11px] font-mono text-zinc-400 flex flex-col gap-1.5 mt-2">
                                            <li>✓ 30 pistas por sesión</li>
                                            <li>✓ Diagnóstico FFT 16/18/20 kHz</li>
                                            <li>✓ Waveform básico DJ</li>
                                        </ul>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handlePlanSelected('free')}
                                        className="mt-4 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold transition-colors"
                                    >
                                        Comenzar Gratis
                                    </button>
                                </div>

                                {/* Plan Pro (Destacado) */}
                                <div 
                                    onClick={() => setSelectedPlan('pro')}
                                    className={`p-4 rounded-2xl border relative transition-all cursor-pointer flex flex-col justify-between ${
                                        selectedPlan === 'pro'
                                            ? 'bg-[#0f142b] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                            : 'bg-zinc-950/80 border-cyan-500/30 hover:border-cyan-500/60'
                                    }`}
                                >
                                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-cyan-400 text-black text-[9px] font-mono font-black uppercase tracking-wider shadow">
                                        Recomendado Club
                                    </span>
                                    <div>
                                        <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Profesional</span>
                                        <h4 className="font-mono font-black text-sm text-white mt-0.5">DJ Pro Club</h4>
                                        <div className="text-2xl font-mono font-black text-cyan-300 my-2">
                                            {billingCycle === 'annual' ? '89 €' : '9,99 €'}
                                            <span className="text-xs text-zinc-400 font-normal"> / {billingCycle === 'annual' ? 'año' : 'mes'}</span>
                                        </div>
                                        <ul className="text-[11px] font-mono text-zinc-300 flex flex-col gap-1.5 mt-2">
                                            <li>✓ Auditoría ilimitada en lote</li>
                                            <li>✓ Descargas SuperFLAC Lossless</li>
                                            <li>✓ 8 Hot Cues automáticos</li>
                                            <li>✓ Sincronización Rekordbox & Serato</li>
                                            <li>✓ BeatWave Copilot en Vivo</li>
                                        </ul>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handlePlanSelected('pro')}
                                        className="mt-4 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black transition-all shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                                    >
                                        Elegir Plan Pro ➔
                                    </button>
                                </div>

                                {/* Plan Lifetime */}
                                <div 
                                    onClick={() => setSelectedPlan('lifetime')}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                        selectedPlan === 'lifetime'
                                            ? 'bg-zinc-900/90 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                >
                                    <div>
                                        <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">Pago Único</span>
                                        <h4 className="font-mono font-black text-sm text-white mt-0.5">Founder Lifetime</h4>
                                        <div className="text-2xl font-mono font-black text-purple-300 my-2">
                                            189 €
                                            <span className="text-xs text-zinc-400 font-normal"> vitalicio</span>
                                        </div>
                                        <ul className="text-[11px] font-mono text-zinc-400 flex flex-col gap-1.5 mt-2">
                                            <li>✓ Cero cuotas mensuales para siempre</li>
                                            <li>✓ Todas las funciones Pro incluidas</li>
                                            <li>✓ Soporte VIP prioritario</li>
                                        </ul>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handlePlanSelected('lifetime')}
                                        className="mt-4 w-full py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/50 font-mono text-xs font-bold transition-colors"
                                    >
                                        Licencia Vitalicia ➔
                                    </button>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <Icons.ChevronLeft size={14} />
                                    <span>Atrás</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePlanSelected(selectedPlan)}
                                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer flex items-center gap-2"
                                >
                                    <span>Continuar con {selectedPlan === 'free' ? 'Plan Free' : selectedPlan === 'lifetime' ? 'Lifetime' : 'DJ Pro'}</span>
                                    <Icons.ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PASO 3: PASARELA DE PAGO & FACTURACIÓN */}
                    {step === 3 && (
                        <div className="flex flex-col gap-4">
                            {paymentError && (
                                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
                                    <Icons.Warning size={14} className="shrink-0 text-red-400" />
                                    <span>{paymentError}</span>
                                </div>
                            )}

                            {/* Selector de Método de Pago */}
                            <div>
                                <label className="block text-[11px] font-mono uppercase text-zinc-400 font-bold mb-2">
                                    Selecciona tu Pasarela de Pago
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                                    {/* Tarjeta */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            paymentMethod === 'card'
                                                ? 'bg-zinc-900 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        <Icons.CreditCard size={18} className="text-cyan-400" />
                                        <span className="font-bold text-[11px]">Tarjeta Bancaria</span>
                                    </button>

                                    {/* Google Pay */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('gpay')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            paymentMethod === 'gpay'
                                                ? 'bg-zinc-900 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-base font-black">🟢 GPay</span>
                                        <span className="font-bold text-[11px]">Google Pay</span>
                                    </button>

                                    {/* Apple Pay */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('applepay')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            paymentMethod === 'applepay'
                                                ? 'bg-zinc-900 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                                                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-base font-black"> Pay</span>
                                        <span className="font-bold text-[11px]">Apple Pay</span>
                                    </button>

                                    {/* PayPal */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('paypal')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            paymentMethod === 'paypal'
                                                ? 'bg-zinc-900 border-amber-400 text-white shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                                                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-base font-black text-amber-400">🅿️ PayPal</span>
                                        <span className="font-bold text-[11px]">PayPal</span>
                                    </button>
                                </div>
                            </div>

                            {/* Contenido según método de pago */}
                            {paymentMethod === 'card' && (
                                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 flex flex-col gap-3 font-mono">
                                    <div>
                                        <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">
                                            Número de Tarjeta (Visa / Mastercard / Amex) *
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="4242 •••• •••• 4242"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-cyan-400 text-white text-xs outline-none tracking-widest"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">
                                                Caducidad (MM/AA) *
                                            </label>
                                            <input 
                                                type="text" 
                                                placeholder="08/28"
                                                value={cardExpiry}
                                                onChange={handleExpiryChange}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-cyan-400 text-white text-xs outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">
                                                Código CVC / CVV *
                                            </label>
                                            <input 
                                                type="password" 
                                                maxLength={4}
                                                placeholder="123"
                                                value={cardCvc}
                                                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-cyan-400 text-white text-xs outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">
                                            Nombre del Titular
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Nombre como figura en la tarjeta"
                                            value={cardHolder}
                                            onChange={(e) => setCardHolder(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-cyan-400 text-white text-xs outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'gpay' && (
                                <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 flex flex-col items-center justify-center text-center gap-3 font-mono">
                                    <div className="text-3xl">🟢</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Google Pay Express Checkout</h4>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            Paga de forma rápida y segura con los métodos guardados en tu cuenta de Google Play / Google Pay.
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                                        ✓ Cuentas bancarias y tarjetas protegidas con tokenización Google
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'applepay' && (
                                <div className="p-5 rounded-2xl bg-zinc-950/90 border border-white/30 flex flex-col items-center justify-center text-center gap-3 font-mono">
                                    <div className="text-3xl"></div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Apple Pay Instantáneo</h4>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            Autoriza el pago mediante Touch ID o Face ID desde tu dispositivo Mac, iPhone o iPad.
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/20 text-white text-xs font-bold">
                                        ✓ Número de tarjeta privado y encriptado en el Secure Enclave
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'paypal' && (
                                <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 flex flex-col items-center justify-center text-center gap-3 font-mono">
                                    <div className="text-3xl text-amber-400">🅿️</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">PayPal Checkout Seguro</h4>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            Conecta con tu cuenta PayPal o paga en 3 plazos sin intereses.
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold">
                                        ✓ Protección del Comprador PayPal incluida
                                    </div>
                                </div>
                            )}

                            {/* Datos Fiscales / Facturación Rápida */}
                            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 font-mono text-xs flex flex-col gap-2.5">
                                <span className="font-bold text-zinc-300 uppercase text-[10px]">
                                    Datos de Facturación & Desglose
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Dirección fiscal" 
                                        value={billingAddress} 
                                        onChange={(e) => setBillingAddress(e.target.value)}
                                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/60 text-white text-[11px] outline-none" 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="NIF / CIF / DNI (para factura)" 
                                        value={taxId} 
                                        onChange={(e) => setTaxId(e.target.value)}
                                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/60 text-white text-[11px] outline-none" 
                                    />
                                </div>

                                <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-700/40 flex items-center justify-between text-xs">
                                    <div className="text-zinc-400">
                                        <div>Plan: <strong className="text-white">{selectedPlan === 'lifetime' ? 'Founder Lifetime' : 'DJ Pro Club'}</strong> ({billingCycle === 'annual' ? 'Anual' : 'Mensual'})</div>
                                        <div className="text-[10px] text-zinc-500">Base {price} € + IVA 21% ({vat} €)</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-zinc-400 block">Total a pagar hoy:</span>
                                        <span className="text-base font-black text-cyan-300">{total} €</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => setStep(2)}
                                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <Icons.ChevronLeft size={14} />
                                    <span>Atrás</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={handleProcessPayment}
                                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.6)] cursor-pointer flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                            <span>Procesando pago seguro...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🔒 Pagar {total} € y Activar Licencia</span>
                                            <Icons.Check size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PASO 4: CONFIRMACIÓN Y ENTRADA A CABINA */}
                    {step === 4 && (
                        <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4 font-mono">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-bounce">
                                ✓
                            </div>

                            <div>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-black uppercase tracking-wider">
                                    Licencia Oficial Activada
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                                    ¡Bienvenido a la Cabina, {alias || 'DJ'}!
                                </h3>
                                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1.5">
                                    Tu cuenta ha sido creada y configurada con el plan <strong className="text-cyan-300">{selectedPlan === 'free' ? 'Free Starter' : selectedPlan === 'lifetime' ? 'Founder Lifetime' : 'DJ Pro Club'}</strong>.
                                    Hemos enviado la confirmación y recibo de compra a <span className="text-white">{email}</span>.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 w-full max-w-sm text-left text-xs text-zinc-300 flex flex-col gap-1.5">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Software:</span>
                                    <strong className="text-white capitalize">{software}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Método de pago:</span>
                                    <strong className="text-cyan-400 uppercase">{paymentMethod === 'card' ? 'Tarjeta Bancaria' : paymentMethod}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Estado de cabina:</span>
                                    <strong className="text-emerald-400">● 100% OPERATIVA</strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full max-w-sm py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer flex items-center justify-center gap-2 mt-2"
                            >
                                <span>🎧 Entrar a BeatWave Cabina DJ</span>
                                <Icons.ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
