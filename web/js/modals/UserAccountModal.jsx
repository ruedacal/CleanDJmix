const { useState, useEffect, useRef, useCallback } = React;
import { Icons } from '../shell/icons.jsx';
import { useDrawerResize } from '../shell/hooks.js';

// ─── ESPACIO DE USUARIO, LOGIN & GESTIÓN DE SESIONES Y ESTADOS (DRAWER LATERAL DERECHO) ───
export const UserAccountModal = ({ 
    isOpen, 
    onClose, 
    userProfile, 
    onUpdateProfile, 
    savedSessions = [], 
    onSaveCurrentSession, 
    onLoadSession, 
    onDeleteSession,
    currentSessionSnapshot = {},
    onNavigateTab,
    onOpenShortcuts,
    onOpenPricing,
    onOpenRegister
}) => {
    if (!isOpen) return null;

    const { width: drawerWidth, onPointerDown: onResizeDown, resetWidth: onResetWidth } = useDrawerResize('bw_account_drawer_width', 540);

    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'sessions' | 'preferences' | 'billing'
    const [alias, setAlias] = useState((userProfile && userProfile.alias) || 'DJ Alex BeatWave');
    const [fullName, setFullName] = useState((userProfile && userProfile.fullName) || 'Alejandro Rueda');
    const [email, setEmail] = useState((userProfile && userProfile.email) || 'alex.dj@beatwave.pro');
    const [address, setAddress] = useState((userProfile && userProfile.address) || 'Gran Vía 28, 4º B');
    const [city, setCity] = useState((userProfile && userProfile.city) || 'Madrid');
    const [country, setCountry] = useState((userProfile && userProfile.country) || 'España');
    const [phone, setPhone] = useState((userProfile && userProfile.phone) || '+34 612 345 678');
    const [avatarUrl, setAvatarUrl] = useState((userProfile && userProfile.avatarUrl) || '');

    // Gestión de contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

    // Configuración de Cabina
    const [djSoftware, setDjSoftware] = useState((userProfile && userProfile.djSoftware) || 'Serato DJ Pro');
    const [audioInterface, setAudioInterface] = useState((userProfile && userProfile.audioInterface) || 'Focusrite Scarlett 2i2 / Serato Club Kit');
    const [targetLufs, setTargetLufs] = useState((userProfile && userProfile.targetLufs) || -9.0);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(userProfile ? userProfile.autoSave !== false : true);
    
    // Sesiones
    const [sessionNameInput, setSessionNameInput] = useState('');
    const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

    // Facturación, Métodos de Pago & Pasarelas
    const [savedPaymentMethods, setSavedPaymentMethods] = useState([
        { id: 'pm_card_main', type: 'card', brand: 'Mastercard', last4: '4242', exp: '08/29', holder: 'Alejandro Rueda', isDefault: true },
        { id: 'pm_applepay', type: 'applepay', label: 'Apple Pay (Wallet)', isDefault: false }
    ]);
    const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
    const [newMethodType, setNewMethodType] = useState('card');
    const [newCardNumber, setNewCardNumber] = useState('');
    const [newCardExpiry, setNewCardExpiry] = useState('');
    const [newCardCvc, setNewCardCvc] = useState('');
    const [newCardHolder, setNewCardHolder] = useState('Alejandro Rueda');
    const [paypalEmail, setPaypalEmail] = useState('');
    const [demoFilled, setDemoFilled] = useState(false);
    const [billingMsg, setBillingMsg] = useState({ text: '', type: '' });

    // Datos Fiscales
    const [fiscalName, setFiscalName] = useState((userProfile && userProfile.fiscalName) || 'Alejandro Rueda / BeatWave DJ');
    const [fiscalTaxId, setFiscalTaxId] = useState((userProfile && userProfile.taxId) || 'ES-48765432-W');
    const [fiscalAddress, setFiscalAddress] = useState((userProfile && userProfile.fiscalAddress) || 'Gran Vía 28, 4º B');
    const [fiscalCity, setFiscalCity] = useState((userProfile && userProfile.fiscalCity) || 'Madrid');
    const [fiscalZip, setFiscalZip] = useState((userProfile && userProfile.fiscalZip) || '28013');
    const [fiscalCountry, setFiscalCountry] = useState((userProfile && userProfile.fiscalCountry) || 'España');

    const fileInputRef = React.useRef(null);

    const handleAvatarUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                setAvatarUrl(dataUrl);
                if (onUpdateProfile) {
                    onUpdateProfile({ ...userProfile, avatarUrl: dataUrl });
                }
                setSaveSuccessMsg('✓ Imagen de perfil actualizada');
                setTimeout(() => setSaveSuccessMsg(''), 3000);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectPresetAvatar = (url) => {
        setAvatarUrl(url);
        if (onUpdateProfile) {
            onUpdateProfile({ ...userProfile, avatarUrl: url });
        }
        setSaveSuccessMsg('✓ Avatar DJ aplicado');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
    };

    const handleSavePersonalData = () => {
        if (onUpdateProfile) {
            onUpdateProfile({
                ...userProfile,
                alias,
                fullName,
                email,
                address,
                city,
                country,
                phone,
                avatarUrl,
                djSoftware,
                audioInterface,
                targetLufs,
                autoSave: autoSaveEnabled
            });
        }
        setSaveSuccessMsg('✓ Datos personales y de cabina guardados');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
    };

    const handleUpdatePassword = (e) => {
        if (e) e.preventDefault();
        if (!newPassword || newPassword.length < 4) {
            setPasswordMsg({ text: '⚠️ La nueva contraseña debe tener al menos 4 caracteres', type: 'error' });
            setTimeout(() => setPasswordMsg({ text: '', type: '' }), 3500);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ text: '❌ Las contraseñas no coinciden', type: 'error' });
            setTimeout(() => setPasswordMsg({ text: '', type: '' }), 3500);
            return;
        }
        if (onUpdateProfile) {
            onUpdateProfile({ ...userProfile, passwordUpdated: Date.now() });
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ text: '✓ Contraseña actualizada correctamente en el sistema', type: 'success' });
        setTimeout(() => setPasswordMsg({ text: '', type: '' }), 3500);
    };

    const handleCreateSnapshot = (e) => {
        if (e) e.preventDefault();
        const name = sessionNameInput.trim() || `Sesión ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().slice(0, 5)}`;
        if (onSaveCurrentSession) onSaveCurrentSession(name);
        setSessionNameInput('');
        setSaveSuccessMsg(`✓ Sesión "${name}" guardada con éxito`);
        setTimeout(() => setSaveSuccessMsg(''), 3000);
    };

    // Cerrar modal con tecla Escape o botón Atrás de móvil (History API popstate)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        try {
            window.history.pushState({ modal: 'userAccount' }, '');
        } catch (_) {}
        const handlePopState = () => {
            onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [onClose]);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 overflow-hidden select-none pointer-events-none" style={{ zIndex: 99998 }}>
            {/* Backdrop Sólido Plano con Desenfoque */}
            <div 
                className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn pointer-events-auto" 
                style={{ zIndex: 99998 }}
                onClick={onClose}
            />

            {/* Columna Lateral Derecha (Slide-over Drawer) - Redimensionable en Desktop (Drag & Drop), 100% en Móvil */}
            <aside 
                style={{ width: '100%', maxWidth: `${drawerWidth}px`, zIndex: 99999 }}
                className="fixed top-0 bottom-0 right-0 h-full bg-[#0a0b14] border-l-4 border-l-cyan-400 shadow-[-25px_0_60px_rgba(0,0,0,1)] flex flex-col font-sans text-gray-200 animate-slideInRight pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Manija táctil de redimensión (Drag to Resize) para Desktop */}
                <div 
                    onPointerDown={onResizeDown}
                    onDoubleClick={onResetWidth}
                    className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-cyan-500/10 transition-colors"
                    title="Arrastra para redimensionar el panel (Doble clic para restablecer a 500px)"
                >
                    <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-cyan-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>
                {/* Cabecera del Perfil con Look & Feel BeatWave */}
                <div className="px-5 py-3.5 border-b border-djzinc-800 bg-[#0d0e1c] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black text-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0 font-black">
                            <Icons.User size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider">
                                    CUENTA & SESIÓN DJ
                                </h3>
                                <span className="text-[9.5px] bg-cyan-950 text-cyan-300 border border-cyan-500/60 px-2 py-0.5 rounded-full font-black">
                                    PERFIL CABINA
                                </span>
                            </div>
                            <p className="text-[10.5px] text-gray-400 font-mono truncate max-w-[280px] sm:max-w-[400px]">
                                {alias} • {email}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="h-8 px-2.5 sm:px-2 rounded-xl bg-[#14162a] hover:bg-cyan-950/60 text-gray-300 hover:text-cyan-300 flex items-center justify-center gap-1.5 border border-djzinc-700 hover:border-cyan-400/80 transition-colors cursor-pointer text-xs font-mono font-bold"
                            title="Cerrar (ESC)"
                        >
                            <Icons.Close size={15} />
                            <span className="sm:hidden font-mono text-[11px]">Cerrar</span>
                        </button>
                    </div>
                </div>

                {/* Ficha Resumen del Usuario con Avatar */}
                <div className="p-4 sm:p-5 border-b border-djzinc-800 bg-[#0a0b16] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3.5">
                        {/* Círculo de Perfil / Avatar con Botón de Cambio */}
                        <div className="relative group shrink-0">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-400 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar DJ" className="w-full h-full object-cover" />
                                ) : (
                                    <Icons.Headphones size={14} className="inline-block align-[-2px]" />
                                )}
                            </div>

                            {/* Botón flotante para cambiar foto del círculo */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center text-[10px] font-black border-2 border-[#0d0e1c] shadow cursor-pointer transition-transform hover:scale-110"
                                title="Cambiar imagen del círculo (Subir foto)"
                            >
                                <Icons.Image size={14} className="inline-block align-[-2px]" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleAvatarUpload} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-mono font-black uppercase text-white tracking-wider truncate max-w-[210px]">
                                    {alias}
                                </h3>
                                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/60 px-2 py-0.5 rounded-full font-black shrink-0">
                                    {(userProfile && userProfile.plan) || 'PRO CABINA VIP'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono truncate max-w-[240px]">
                                {fullName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                <span>Cabina Activa • 0 Latencia</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-djzinc-850 hover:bg-djzinc-750 text-gray-400 hover:text-white flex items-center justify-center font-mono text-sm border border-djzinc-700 transition-colors cursor-pointer shrink-0"
                        title="Cerrar (ESC)"
                    >
                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                    </button>
                </div>

                {/* Acceso Rápido Integrado: Atajos, Trends y Guías (Reubicados para Descongestionar el Menú) */}
                <div className="p-3 bg-[#0d0e1a] border-b border-djzinc-800 grid grid-cols-3 gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            if (onNavigateTab) onNavigateTab('trends');
                        }}
                        className="p-2.5 rounded-xl bg-[#141528] hover:bg-[#1c1e38] border border-indigo-700/60 text-indigo-200 hover:text-white flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
                        title="Explorar Tendencias Musicales Globales y Festivales"
                    >
                        <Icons.Trends size={14} className="inline-block align-[-2px] group-hover:scale-110 transition-transform" />
                        <span className="truncate">Trends</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            if (onNavigateTab) onNavigateTab('knowledge');
                        }}
                        className="p-2.5 rounded-xl bg-[#181329] hover:bg-[#231a3d] border border-purple-700/60 text-purple-200 hover:text-white flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
                        title="Academia de Guías, Armonía y Teoría DJ"
                    >
                        <Icons.Knowledge size={14} className="inline-block align-[-2px] group-hover:scale-110 transition-transform" />
                        <span className="truncate">Guías</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            if (onOpenShortcuts) onOpenShortcuts();
                        }}
                        className="p-2.5 rounded-xl bg-[#0f1d2a] hover:bg-[#14283b] border border-cyan-700/60 text-cyan-200 hover:text-white flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
                        title="Ver Chuleta de Atajos de Teclado DJ"
                    >
                        <Icons.Keyboard size={14} className="inline-block align-[-2px] group-hover:scale-110 transition-transform" />
                        <span className="truncate">Atajos</span>
                    </button>
                </div>

                {/* Sub-navegación por Pestañas */}
                <div className="px-4 py-2 bg-[#06070e] border-b border-djzinc-800 flex items-center gap-2 font-mono text-xs shrink-0 overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            activeTab === 'profile'
                                ? 'bg-cyan-500 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                        }`}
                    >
                        <Icons.User size={14} className="inline-block align-[-2px]" /> <span>Datos & Seguridad</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('billing')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            activeTab === 'billing'
                                ? 'bg-cyan-500 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                        }`}
                    >
                        <Icons.CreditCard size={14} className="inline-block align-[-2px]" /> <span>Datos de Pago & Plan</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('sessions')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            activeTab === 'sessions'
                                ? 'bg-cyan-500 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                        }`}
                    >
                        <Icons.Save size={14} className="inline-block align-[-2px]" /> <span>Sesiones & Estados</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('preferences')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            activeTab === 'preferences'
                                ? 'bg-cyan-500 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                : 'text-gray-400 hover:text-white hover:bg-djzinc-850'
                        }`}
                    >
                        <Icons.Sliders size={14} className="inline-block align-[-2px]" /> <span>Suite & Audio</span>
                    </button>
                </div>

                {/* Mensaje de Confirmación Global o Facturación */}
                {(saveSuccessMsg || billingMsg.text) && (
                    <div className={`px-4 py-2 border-b text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn shrink-0 ${
                        (billingMsg.type === 'error')
                            ? 'bg-rose-950/90 border-rose-600/70 text-rose-300'
                            : 'bg-emerald-950/90 border-emerald-600/70 text-emerald-300'
                    }`}>
                        <Icons.Sparkles size={14} className="inline-block align-[-2px]" />
                        <span>{saveSuccessMsg || billingMsg.text}</span>
                    </div>
                )}

                {/* Contenido Scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-5">
                    {/* PESTAÑA 1: DATOS PERSONALES, FOTO & CONTRASEÑA */}
                    {activeTab === 'profile' && (
                        <div className="space-y-5">
                            {/* Selector de Avatares Predefinidos */}
                            <div className="p-3.5 rounded-2xl bg-djzinc-900/60 border border-djzinc-800 space-y-2">
                                <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block">
                                    Avatares DJ de Cabina Rápidos
                                </label>
                                <div className="flex items-center gap-2 overflow-x-auto py-1">
                                    {[
                                        { label: 'Cyber', icon: '🎧', bg: 'from-cyan-500 to-blue-600' },
                                        { label: 'Vinilo', icon: '💽', bg: 'from-purple-500 to-indigo-600' },
                                        { label: 'Neon', icon: '⚡', bg: 'from-pink-500 to-rose-600' },
                                        { label: 'Club', icon: '🕶️', bg: 'from-amber-500 to-orange-600' },
                                        { label: 'Vocal', icon: '🎙️', bg: 'from-emerald-500 to-teal-600' }
                                    ].map((preset, pIdx) => (
                                        <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => handleSelectPresetAvatar(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%230c0c16"/><text x="40" y="48" font-size="34" text-anchor="middle" dominant-baseline="middle">${preset.icon}</text></svg>`)}
                                            className="px-2.5 py-1.5 rounded-xl bg-djzinc-950 border border-djzinc-750 hover:border-cyan-400 flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer transition-all hover:scale-105 shrink-0"
                                        >
                                            <span>{preset.icon}</span>
                                            <span>{preset.label}</span>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-600 text-cyan-300 font-mono font-bold text-xs hover:bg-cyan-900 cursor-pointer shrink-0"
                                    >
                                        + Subir Foto
                                    </button>
                                </div>
                            </div>

                            {/* Formulario de Datos Personales */}
                            <div className="space-y-3 p-4 rounded-2xl bg-[#0c0d18] border border-djzinc-800">
                                <h4 className="text-xs font-mono font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                                    <Icons.Copy size={14} className="inline-block align-[-2px]" /> <span>Datos Personales & Facturación</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Alias / Nombre Artístico</label>
                                        <input 
                                            type="text"
                                            value={alias}
                                            onChange={(e) => setAlias(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                            placeholder="DJ Alex"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Nombre Completo</label>
                                        <input 
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                            placeholder="Alejandro Rueda"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Correo Electrónico</label>
                                        <input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                            placeholder="alex.dj@beatwave.pro"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Teléfono / Móvil</label>
                                        <input 
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                            placeholder="+34 612 345 678"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Dirección de Cabina / Residencia</label>
                                    <input 
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                        placeholder="Gran Vía 28, 4º B"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Ciudad</label>
                                        <input 
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                            placeholder="Madrid"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">País</label>
                                        <input 
                                            type="text"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                            placeholder="España"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSavePersonalData}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-md mt-2"
                                >
                                    <Icons.Save size={14} className="inline-block align-[-2px]" /> Guardar Datos Personales
                                </button>
                            </div>

                            {/* Sección: Modificar Contraseña de Acceso */}
                            <form onSubmit={handleUpdatePassword} className="space-y-3 p-4 rounded-2xl bg-[#0c0d18] border border-djzinc-800">
                                <h4 className="text-xs font-mono font-black uppercase text-pink-400 tracking-wider flex items-center gap-1.5">
                                    <Icons.Lock size={14} className="inline-block align-[-2px]" /> <span>Modificar Contraseña de Acceso</span>
                                </h4>

                                {passwordMsg.text && (
                                    <div className={`p-2 rounded-xl text-xs font-mono font-bold animate-fadeIn ${
                                        passwordMsg.type === 'success' 
                                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700' 
                                            : 'bg-rose-950/80 text-rose-300 border border-rose-700'
                                    }`}>
                                        {passwordMsg.text}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Contraseña Actual</label>
                                    <input 
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-pink-500 outline-none"
                                        placeholder="••••••••••••"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Nueva Contraseña</label>
                                        <input 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-pink-500 outline-none"
                                            placeholder="Nueva clave..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10.5px] font-mono text-gray-400 uppercase font-bold block">Repetir Nueva Contraseña</label>
                                        <input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-pink-500 outline-none"
                                            placeholder="Confirmar clave..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-mono font-black text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-md mt-2"
                                >
                                    <Icons.Lock size={14} className="inline-block align-[-2px]" /> Actualizar Contraseña
                                </button>
                            </form>
                        </div>
                    )}

                    {/* PESTAÑA 2: SESIONES Y CONTINUIDAD */}
                    {activeTab === 'sessions' && (
                        <div className="space-y-4">
                            {/* Card de Sesión Activa */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-djzinc-900 border border-cyan-500/40 space-y-2">
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="text-cyan-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                        ESTADO ACTUAL EN CABINA
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 text-[10px] font-bold">
                                        Auto-Guardado Activo
                                    </span>
                                </div>
                                <div className="text-xs text-gray-300 space-y-1">
                                    <div><strong>Carpeta:</strong> <span className="font-mono text-gray-400 text-[11px]">{currentSessionSnapshot.folder || 'Sin carpeta cargada'}</span></div>
                                    <div className="flex gap-4 text-[11px]">
                                        <span><strong>Pistas en Lote:</strong> {currentSessionSnapshot.tracksCount || 0}</span>
                                        <span><strong>Pestaña Activa:</strong> <span className="uppercase text-cyan-300 font-mono">{currentSessionSnapshot.activeTab || 'AUDIT'}</span></span>
                                    </div>
                                </div>

                                {/* Formulario para Guardar Nuevo Snapshot */}
                                <form onSubmit={handleCreateSnapshot} className="pt-2 flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Nombre de la sesión (ej: Space Ibiza Warmup)..."
                                        value={sessionNameInput}
                                        onChange={(e) => setSessionNameInput(e.target.value)}
                                        className="flex-1 px-3 py-1.5 rounded-xl bg-djzinc-950 border border-djzinc-750 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                    />
                                    <button 
                                        type="submit"
                                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-xs uppercase cursor-pointer transition-all active:scale-95 whitespace-nowrap shadow-md"
                                    >
                                        <Icons.Save size={14} className="inline-block align-[-2px]" /> Guardar Estado
                                    </button>
                                </form>
                            </div>

                            {/* Lista de Sesiones Guardadas Anteriores */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                                    <span>Sesiones Guardadas ({savedSessions.length})</span>
                                    <span className="text-[10px] text-gray-500">Reanuda cualquier sesión con 1 clic</span>
                                </h4>

                                {savedSessions.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-djzinc-900/60 border border-djzinc-800 text-center text-xs text-gray-500 font-mono">
                                        No hay sesiones guardadas todavía. Guarda tu sesión actual arriba para continuar cuando quieras.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {savedSessions.map((sess) => (
                                            <div key={sess.id} className="p-3 rounded-xl bg-[#0c0d18] border border-djzinc-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-mono font-bold text-white truncate">
                                                        {sess.name}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400 mt-0.5">
                                                        <span><Icons.Calendar size={14} className="inline-block align-[-2px]" /> {sess.date}</span>
                                                        <span><Icons.Music size={14} className="inline-block align-[-2px]" /> {sess.tracksCount || 0} pistas</span>
                                                        <span className="text-cyan-400 uppercase">{sess.activeTab || 'audit'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0 font-mono">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (onLoadSession) onLoadSession(sess);
                                                            setSaveSuccessMsg(`✓ Sesión "${sess.name}" cargada. ¡Listo para mezclar!`);
                                                            setTimeout(() => setSaveSuccessMsg(''), 3000);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                                        title="Cargar y reanudar esta sesión"
                                                    >
                                                        <span>↺</span>
                                                        <span>Reanudar</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteSession && onDeleteSession(sess.id)}
                                                        className="p-1 rounded-lg bg-djzinc-900 hover:bg-rose-950 text-gray-500 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                                                        title="Eliminar sesión guardada"
                                                    >
                                                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PESTAÑA 3: SUITE & PREFERENCIAS */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block">Software DJ Principal</label>
                                    <select
                                        value={djSoftware}
                                        onChange={(e) => setDjSoftware(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-800 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                    >
                                        <option value="Serato DJ Pro">Serato DJ Pro</option>
                                        <option value="Rekordbox 7">Rekordbox 7 (Pioneer DJ)</option>
                                        <option value="Traktor Pro 3">Traktor Pro 3 (Native Instruments)</option>
                                        <option value="VirtualDJ 2024">VirtualDJ Pro 2024</option>
                                        <option value="Engine DJ">Engine DJ (Denon DJ)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block">Interfaz de Audio</label>
                                    <input 
                                        type="text"
                                        value={audioInterface}
                                        onChange={(e) => setAudioInterface(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-djzinc-950 border border-djzinc-800 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-djzinc-900/60 border border-djzinc-800 space-y-2">
                                <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block flex justify-between">
                                    <span>Target de Normalización Acústica (LUFS)</span>
                                    <span className="text-cyan-400 font-bold">{targetLufs} LUFS</span>
                                </label>
                                <input 
                                    type="range"
                                    min="-14"
                                    max="-6"
                                    step="0.5"
                                    value={targetLufs}
                                    onChange={(e) => setTargetLufs(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400 cursor-pointer"
                                />
                                <p className="text-[10px] text-gray-500 font-sans">
                                    -9.0 LUFS es el estándar recomendado para festivales y discotecas con pegada contundente y máxima claridad.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#0c0d18] border border-djzinc-800 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-white text-xs font-mono">Auto-Guardado Continuo de Estados</div>
                                    <div className="text-[10px] text-gray-400">Guarda carpetas, listas y filtros al vuelo en segundo plano</div>
                                </div>
                                <input 
                                    type="checkbox"
                                    checked={autoSaveEnabled}
                                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSavePersonalData}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-md"
                            >
                                Guardar Preferencias de Cabina
                            </button>
                        </div>
                    )}

                    {/* PESTAÑA 4: DATOS DE PAGO & PLAN */}
                    {activeTab === 'billing' && (
                        <div className="space-y-5 animate-fadeIn">
                            {/* Resumen del Plan Actual y Acciones de Upgrade */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0e1628] via-[#0d1222] to-[#120e28] border border-cyan-500/40 relative overflow-hidden shadow-lg">
                                <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                                
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-mono text-xs font-black shadow-sm">
                                            VIP
                                        </span>
                                        <div>
                                            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                                                Plan Activo
                                            </span>
                                            <h4 className="text-base font-mono font-black text-white">
                                                {(userProfile && userProfile.plan) || 'BEATWAVE PRO CLUB (ANUAL)'}
                                            </h4>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-mono font-black flex items-center gap-1.5 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        ACTIVO
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs mb-4">
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase">Tarifa</div>
                                        <div className="text-white font-bold text-sm">89,00 € <span className="text-[10px] text-zinc-400 font-normal">/ año</span></div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase">Renovación</div>
                                        <div className="text-zinc-200 font-medium">15 Nov 2027</div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <div className="text-[10px] text-zinc-500 uppercase">Ahorro Aplicado</div>
                                        <div className="text-emerald-400 font-bold">25% Descuento Anual</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            if (onOpenPricing) onOpenPricing();
                                        }}
                                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase text-[11px] tracking-wider transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                                    >
                                        Cambiar Plan / Mejorar ➔
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            if (onOpenRegister) onOpenRegister();
                                        }}
                                        className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer"
                                    >
                                        + Nueva Licencia / Registro
                                    </button>
                                </div>
                            </div>

                            {/* Métodos de Pago Guardados y Pasarelas */}
                            <div className="p-4 rounded-2xl bg-djzinc-900/60 border border-djzinc-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icons.CreditCard size={15} className="text-cyan-400 inline-block align-[-2px]" />
                                        <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                                            Métodos de Pago & Pasarelas
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}
                                        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                                    >
                                        {showAddPaymentForm ? '− Cancelar' : '+ Añadir Método'}
                                    </button>
                                </div>

                                {/* Lista de métodos actuales */}
                                <div className="space-y-2">
                                    {savedPaymentMethods.map((pm) => (
                                        <div key={pm.id} className="p-3 rounded-xl bg-[#0c0d1a] border border-djzinc-800 flex items-center justify-between gap-3 font-mono text-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-7 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                                    {pm.type === 'card' ? '💳' : pm.type === 'applepay' ? '' : pm.type === 'gpay' ? 'GPay' : 'PP'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        <span>{pm.brand || pm.label}</span>
                                                        {pm.last4 && <span className="text-zinc-400">•••• {pm.last4}</span>}
                                                        {pm.isDefault && (
                                                            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-600/50 px-1.5 py-0.5 rounded-full font-bold">
                                                                Predeterminado
                                                            </span>
                                                        )}
                                                    </div>
                                                    {pm.exp && <div className="text-[10px] text-zinc-500">Expira: {pm.exp}</div>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!pm.isDefault && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSavedPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === pm.id })));
                                                            setBillingMsg({ text: '✓ Método predeterminado actualizado', type: 'success' });
                                                            setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                                        }}
                                                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer"
                                                    >
                                                        Usar por defecto
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSavedPaymentMethods(prev => prev.filter(m => m.id !== pm.id));
                                                        setBillingMsg({ text: '✓ Método de pago eliminado', type: 'success' });
                                                        setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                                    }}
                                                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                                                    title="Eliminar método"
                                                >
                                                    <Icons.Close size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Formulario desplegable para añadir nuevo método */}
                                {showAddPaymentForm && (
                                    <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3 font-mono animate-fadeIn">
                                        <div className="text-[11px] font-bold text-gray-300 uppercase">Selecciona Método de Pago</div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                                            {[
                                                { id: 'card', label: 'Tarjeta', icon: '💳' },
                                                { id: 'applepay', label: 'Apple Pay', icon: '' },
                                                { id: 'gpay', label: 'Google Pay', icon: 'GPay' },
                                                { id: 'paypal', label: 'PayPal', icon: '🅿️' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setNewMethodType(opt.id)}
                                                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition-all cursor-pointer ${
                                                        newMethodType === opt.id
                                                            ? 'bg-cyan-500 text-black border-cyan-400 font-black shadow-sm'
                                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                                    }`}
                                                >
                                                    <span className="text-sm">{opt.icon}</span>
                                                    <span className="text-[10px]">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {newMethodType === 'card' && (
                                            <div className="space-y-2 pt-1 text-xs">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Número de Tarjeta</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewCardNumber('4242 4242 4242 4242');
                                                                setNewCardExpiry('12/28');
                                                                setNewCardCvc('888');
                                                                setNewCardHolder('DJ TESTER PRO');
                                                                setDemoFilled(true);
                                                            }}
                                                            className="text-[9.5px] font-mono font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1"
                                                            title="Rellenar datos de prueba para verificar pasarela en local"
                                                        >
                                                            <span>⚡</span> <span>Rellenar Tarjeta Demo</span>
                                                        </button>
                                                    </div>
                                                    {demoFilled && (
                                                        <div className="mb-2 p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/70 text-cyan-200 text-[10.5px] font-mono flex items-center justify-between animate-fadeIn shadow-sm">
                                                            <span>⚡ Tarjeta demo cargada. Revisa los datos y pulsa "Confirmar y Guardar".</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewCardNumber('');
                                                                    setNewCardExpiry('');
                                                                    setNewCardCvc('');
                                                                    setNewCardHolder('Alejandro Rueda');
                                                                    setDemoFilled(false);
                                                                }}
                                                                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer ml-2"
                                                            >
                                                                Limpiar
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="relative">
                                                        <input 
                                                            type="text" 
                                                            placeholder="4532 •••• •••• ••••"
                                                            value={newCardNumber}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                                                                const parts = val.match(/.{1,4}/g);
                                                                setNewCardNumber(parts ? parts.join(' ') : val);
                                                            }}
                                                            className="w-full pl-3 pr-20 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400 font-mono tracking-wider"
                                                        />
                                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                                            {newCardNumber.startsWith('4') ? (
                                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wider">VISA</span>
                                                            ) : newCardNumber.startsWith('5') ? (
                                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-600 text-white tracking-wider">MC</span>
                                                            ) : newCardNumber.startsWith('3') ? (
                                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-600 text-white tracking-wider">AMEX</span>
                                                            ) : (
                                                                <span className="text-[9px] font-mono text-zinc-500 font-bold">CARD</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Vencimiento (MM/AA)</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="MM/AA"
                                                            value={newCardExpiry}
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                                if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                                                                setNewCardExpiry(val);
                                                            }}
                                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">CVC / CVV</label>
                                                        <input 
                                                            type="password" 
                                                            maxLength={4}
                                                            placeholder="•••"
                                                            value={newCardCvc}
                                                            onChange={(e) => setNewCardCvc(e.target.value.replace(/\D/g, ''))}
                                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400 font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Titular de la Tarjeta</label>
                                                    <input 
                                                        type="text" 
                                                        value={newCardHolder}
                                                        onChange={(e) => setNewCardHolder(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400 font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {newMethodType === 'applepay' && (
                                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2.5">
                                                <p className="text-[11px] text-zinc-300">Vincula tus tarjetas configuradas en el Wallet de Apple mediante Touch ID o Face ID.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const id = 'pm_' + Date.now();
                                                        setSavedPaymentMethods(prev => [...prev, { id, type: 'applepay', label: 'Apple Pay (Wallet)', isDefault: true }]);
                                                        setShowAddPaymentForm(false);
                                                        setBillingMsg({ text: '✓ Apple Pay vinculado correctamente con Touch ID/Face ID', type: 'success' });
                                                        setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                                    }}
                                                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-black text-xs inline-flex items-center gap-2 shadow cursor-pointer transition-transform active:scale-95"
                                                >
                                                    <span> Pay</span> <span>Conectar Apple Wallet</span>
                                                </button>
                                            </div>
                                        )}

                                        {newMethodType === 'gpay' && (
                                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2.5">
                                                <p className="text-[11px] text-zinc-300">Conecta tu cuenta de Google Play / Google Pay para facturación directa.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const id = 'pm_' + Date.now();
                                                        setSavedPaymentMethods(prev => [...prev, { id, type: 'gpay', label: 'Google Pay / Google Play', isDefault: true }]);
                                                        setShowAddPaymentForm(false);
                                                        setBillingMsg({ text: '✓ Google Play / Google Pay vinculado como método predeterminado', type: 'success' });
                                                        setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                                    }}
                                                    className="py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow cursor-pointer transition-transform active:scale-95"
                                                >
                                                    <span>G Pay</span> <span>Conectar con Google</span>
                                                </button>
                                            </div>
                                        )}

                                        {newMethodType === 'paypal' && (
                                            <div className="space-y-2 pt-1 text-xs">
                                                <label className="text-[10px] text-zinc-400 uppercase font-bold block">Email de Cuenta PayPal</label>
                                                <input 
                                                    type="email" 
                                                    placeholder="dj.billing@paypal.com"
                                                    value={paypalEmail}
                                                    onChange={(e) => setPaypalEmail(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400 font-mono"
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddPaymentForm(false);
                                                    setDemoFilled(false);
                                                }}
                                                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono font-bold text-xs cursor-pointer transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (newMethodType === 'card' && (!newCardNumber || newCardNumber.replace(/\s/g, '').length < 12)) {
                                                        setBillingMsg({ text: '⚠️ Introduce los 16 dígitos de la tarjeta', type: 'error' });
                                                        setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                                        return;
                                                    }
                                                    const id = 'pm_' + Date.now();
                                                    if (newMethodType === 'card') {
                                                        const cleanCard = newCardNumber.replace(/\s/g, '');
                                                        const last4 = cleanCard ? cleanCard.slice(-4) : '9988';
                                                        setSavedPaymentMethods(prev => [...prev, { id, type: 'card', brand: 'Visa / Mastercard', last4, exp: newCardExpiry || '12/28', holder: newCardHolder || 'DJ CABINA', isDefault: true }]);
                                                    } else if (newMethodType === 'applepay') {
                                                        setSavedPaymentMethods(prev => [...prev, { id, type: 'applepay', label: 'Apple Pay (Wallet)', isDefault: true }]);
                                                    } else if (newMethodType === 'gpay') {
                                                        setSavedPaymentMethods(prev => [...prev, { id, type: 'gpay', label: 'Google Pay / Google Play', isDefault: true }]);
                                                    } else {
                                                        setSavedPaymentMethods(prev => [...prev, { id, type: 'paypal', label: `PayPal (${paypalEmail || 'Cuenta Conectada'})`, isDefault: true }]);
                                                    }
                                                    setShowAddPaymentForm(false);
                                                    setDemoFilled(false);
                                                    setBillingMsg({ text: '✓ Método de pago verificado y guardado como predeterminado', type: 'success' });
                                                    setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                                }}
                                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                                            >
                                                <span>✓</span> <span>Confirmar y Guardar Método de Pago</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Datos Fiscales para Facturación */}
                            <div className="p-4 rounded-2xl bg-djzinc-900/60 border border-djzinc-800 space-y-3 font-mono">
                                <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center justify-between">
                                    <span>Datos Fiscales & NIF / CIF</span>
                                    <span className="text-[10px] text-zinc-500">Para emisión automática de facturas</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Nombre / Razón Social</label>
                                        <input 
                                            type="text" 
                                            value={fiscalName}
                                            onChange={(e) => setFiscalName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">NIF / CIF / VAT ID</label>
                                        <input 
                                            type="text" 
                                            value={fiscalTaxId}
                                            onChange={(e) => setFiscalTaxId(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Dirección Fiscal</label>
                                        <input 
                                            type="text" 
                                            value={fiscalAddress}
                                            onChange={(e) => setFiscalAddress(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Ciudad & CP</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                type="text" 
                                                value={fiscalCity}
                                                onChange={(e) => setFiscalCity(e.target.value)}
                                                className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400"
                                            />
                                            <input 
                                                type="text" 
                                                value={fiscalZip}
                                                onChange={(e) => setFiscalZip(e.target.value)}
                                                className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">País</label>
                                        <input 
                                            type="text" 
                                            value={fiscalCountry}
                                            onChange={(e) => setFiscalCountry(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onUpdateProfile) {
                                            onUpdateProfile({
                                                ...userProfile,
                                                fiscalName,
                                                taxId: fiscalTaxId,
                                                fiscalAddress,
                                                fiscalCity,
                                                fiscalZip,
                                                fiscalCountry
                                            });
                                        }
                                        setBillingMsg({ text: '✓ Datos fiscales de facturación guardados', type: 'success' });
                                        setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase cursor-pointer transition-all"
                                >
                                    Guardar Datos Fiscales
                                </button>
                            </div>

                            {/* Historial de Facturas con desglose 21% IVA */}
                            <div className="p-4 rounded-2xl bg-djzinc-900/60 border border-djzinc-800 space-y-3 font-mono">
                                <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center justify-between">
                                    <span>Historial de Facturas (IVA 21% Desglosado)</span>
                                    <span className="text-[10px] text-cyan-400 font-bold">2 Facturas Emitidas</span>
                                </h4>

                                <div className="space-y-2">
                                    {[
                                        { num: 'BW-2026-0891', date: '15/11/2026', concept: 'BeatWave Pro Anual', base: '73,55 €', vat: '15,45 €', total: '89,00 €' },
                                        { num: 'BW-2025-0104', date: '15/11/2025', concept: 'BeatWave Pro Anual', base: '73,55 €', vat: '15,45 €', total: '89,00 €' }
                                    ].map(fac => (
                                        <div key={fac.num} className="p-3 rounded-xl bg-[#0c0d18] border border-djzinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    <span>{fac.num}</span>
                                                    <span className="text-[10px] text-zinc-400">• {fac.date}</span>
                                                </div>
                                                <div className="text-[11px] text-zinc-400 mt-0.5">
                                                    {fac.concept} (Base: {fac.base} + IVA 21%: {fac.vat})
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-cyan-300">{fac.total}</span>
                                                    <span className="text-[9px] text-emerald-400 block font-bold">PAGADA</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBillingMsg({ text: `✓ Descargando ${fac.num}.pdf...`, type: 'success' });
                                                        setTimeout(() => setBillingMsg({ text: '', type: '' }), 3000);
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                                                    title="Descargar Factura PDF"
                                                >
                                                    PDF ⤓
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pie del Drawer - Sticky con máxima ergonomía de pulgar en móvil */}
                <div className="sticky bottom-0 px-4 sm:px-5 py-3 bg-[#080811]/95 backdrop-blur-md border-t border-djzinc-800 flex items-center justify-between shrink-0 font-mono text-xs z-20">
                    <span className="text-[10px] text-gray-500 hidden sm:inline">
                        BeatWave Pro v1.0.0 • Centro de Control DJ
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-[10px] text-cyan-400 font-bold sm:hidden flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            SESIÓN CABINA
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                            <Icons.Close size={14} />
                            <span>Cerrar Panel</span>
                        </button>
                    </div>
                </div>
            </aside>
        </div>,
        document.body
    );
};

