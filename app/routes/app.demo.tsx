import React, { useState, useEffect } from 'react';
import { Info, ShieldCheck, ChevronRight, Calendar, Clock, Smartphone, ArrowLeft } from 'lucide-react';

export default function Demo() {
    // --- ESTADOS ---
    const [plan, setPlan] = useState('tradicional'); // 'tradicional' | 'fijo'
    const [frecuencia, setFrecuencia] = useState('catorcenal');
    const [numPagos, setNumPagos] = useState(12);

    // --- CONSTANTES & DATOS ---
    const DATA = {
        tradicional: {
            monto: 2300.00,
            desc: "Tú decides cuándo liquidar el total, pagando solo intereses en cada periodo.",
            frecuencias: ['diario', 'semanal', 'catorcenal', 'mensual']
        },
        fijo: {
            monto: 2250.00,
            desc: "Pagos fijos que incluyen capital e intereses. Terminas de pagar en el plazo elegido.",
            frecuencias: ['catorcenal', 'mensual']
        }
    };

    const ARTICULO = {
        tipo: "Celular",
        marca: "APPLE",
        modelo: "IPHONE 12 PRO MAX A2411",
        caracteristicas: ["128 GB", "6 GB RAM"]
    };

    useEffect(() => {
        // @ts-ignore
        const validFrecuencias = DATA[plan].frecuencias;
        if (!validFrecuencias.includes(frecuencia)) {
            setFrecuencia(validFrecuencias[0]);
        }
    }, [plan]);

    // --- CÁLCULOS SIMULADOS ---
    const calcularPagos = () => {
        // @ts-ignore
        const montoPrincipal = DATA[plan].monto;
        let pagoRefrendo = 0;
        let ultimoPago = 0;

        if (plan === 'tradicional') {
            const tasas = { diario: 0.015, semanal: 0.05, catorcenal: 0.09, mensual: 0.15 };
            // @ts-ignore
            const tasa = tasas[frecuencia] || 0.10;
            pagoRefrendo = montoPrincipal * tasa;
            ultimoPago = montoPrincipal + pagoRefrendo;
        } else {
            const tasaBase = frecuencia === 'catorcenal' ? 0.20 : 0.35;
            const interesTotal = montoPrincipal * (tasaBase + (numPagos * 0.02));
            const totalAPagar = montoPrincipal + interesTotal;
            pagoRefrendo = totalAPagar / numPagos;
            ultimoPago = pagoRefrendo;
        }

        return {
            refrendo: pagoRefrendo.toFixed(2),
            ultimo: ultimoPago.toFixed(2),
            montoActual: montoPrincipal
        };
    };

    const { refrendo, ultimo, montoActual } = calcularPagos();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">

            <div className="bg-white w-full max-w-md md:max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">

                {/* --- COLUMNA IZQUIERDA: CONTEXTO DEL ARTÍCULO & OFERTA --- */}
                <div className="w-full md:w-5/12 bg-emerald-900 text-white p-8 flex flex-col relative overflow-hidden">

                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-3xl -mr-20 -mt-20 opacity-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400 rounded-full blur-3xl -ml-10 -mb-10 opacity-10 pointer-events-none"></div>

                    {/* Header Navegación */}
                    <div className="relative z-10 flex items-center gap-2 text-emerald-400/80 mb-8 cursor-pointer hover:text-emerald-200 transition-colors w-fit">
                        <ArrowLeft size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
                    </div>

                    <div className="relative z-10 flex-grow flex flex-col gap-8">

                        {/* 1. Oferta Principal (ARRIBA) */}
                        <div>
                            <div className="flex items-center gap-2 text-emerald-300 mb-2">
                                <ShieldCheck size={16} />
                                <span className="text-xs font-bold tracking-wide uppercase">Oferta Aprobada</span>
                            </div>
                            <p className="text-emerald-100/80 text-sm mb-1 font-medium">Recibe hasta:</p>
                            <h1 className="text-5xl font-extrabold tracking-tight text-white">
                                ${montoActual.toLocaleString()}
                            </h1>
                        </div>

                        {/* 2. Selector de Plan Estilizado (MEDIO) */}
                        <div>
                            <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 block">Elige tu modalidad</label>
                            <div className="bg-emerald-950/40 p-1.5 rounded-xl border border-emerald-800/50 flex relative">
                                {/* Fondo animado del toggle */}
                                <div
                                    className={`absolute top-1.5 bottom-1.5 rounded-lg bg-emerald-100 shadow-md transition-all duration-300 ease-out ${plan === 'tradicional' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[50%] w-[calc(50%-6px)]'
                                        }`}
                                ></div>

                                {['tradicional', 'fijo'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPlan(p)}
                                        className={`relative z-10 flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${plan === p ? 'text-emerald-900' : 'text-emerald-400 hover:text-emerald-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-emerald-300/80 leading-relaxed min-h-[3em]">
                                {/* @ts-ignore */}
                                {DATA[plan].desc}
                            </p>
                        </div>

                        {/* 3. TARJETA DE ARTÍCULO (ABAJO - mt-auto para empujarlo al fondo) */}
                        <div className="mt-auto bg-emerald-800/40 backdrop-blur-md rounded-2xl p-4 border border-emerald-700/50 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="bg-emerald-500/20 text-emerald-100 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                                    <Smartphone size={12} />
                                    Tu garantía
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-white font-bold text-sm leading-tight tracking-tight">
                                    {ARTICULO.modelo}
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-300/80 uppercase tracking-wider">
                                    <span>{ARTICULO.marca}</span>
                                    <span>•</span>
                                    <span>{ARTICULO.caracteristicas[0]}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- COLUMNA DERECHA: CALCULADORA --- */}
                <div className="w-full md:w-7/12 p-8 md:p-10 bg-white flex flex-col h-full">

                    <div className="flex-grow space-y-10">

                        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Personaliza tu pago</h2>
                                <p className="text-slate-400 text-sm mt-1">Ajusta los plazos a tu medida</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                <Clock size={20} />
                            </div>
                        </div>

                        {/* Frecuencia */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <Calendar size={14} className="text-emerald-600" /> Frecuencia
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {/* @ts-ignore */}
                                {DATA[plan].frecuencias.map((freq) => (
                                    <button
                                        key={freq}
                                        onClick={() => setFrecuencia(freq)}
                                        className={`flex-1 min-w-[90px] py-3 px-2 text-sm font-medium rounded-xl border transition-all duration-200 ${frecuencia === freq
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                                                : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 bg-white'
                                            }`}
                                    >
                                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slider Condicional */}
                        {plan === 'fijo' && (
                            <div className="space-y-6 py-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Plazo</label>
                                    <div className="text-right">
                                        <span className="text-3xl font-bold text-emerald-600">{numPagos}</span>
                                        <span className="text-sm font-medium text-slate-400 ml-1">{frecuencia === 'mensual' ? 'Meses' : 'Pagos'}</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="2"
                                    max={frecuencia === 'mensual' ? 12 : 26}
                                    step="1"
                                    value={numPagos}
                                    onChange={(e) => setNumPagos(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-700"
                                />
                            </div>
                        )}

                        {/* Resumen de Pagos */}
                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] group hover:border-emerald-200 transition-colors">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 rounded-l-2xl group-hover:bg-emerald-500 transition-colors"></div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pago {frecuencia}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg text-slate-400 font-medium">$</span>
                                    <span className="text-3xl font-extrabold text-slate-800">{refrendo}</span>
                                </div>
                            </div>

                            <div className={`relative p-5 rounded-2xl border shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] transition-colors ${plan === 'tradicional' ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-200 hover:border-emerald-200'
                                }`}>
                                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-colors ${plan === 'tradicional' ? 'bg-amber-400' : 'bg-slate-200 group-hover:bg-emerald-500'
                                    }`}></div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${plan === 'tradicional' ? 'text-amber-600' : 'text-slate-400'
                                    }`}>Liquidación Final</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-lg font-medium ${plan === 'tradicional' ? 'text-amber-600' : 'text-slate-400'}`}>$</span>
                                    <span className={`text-3xl font-extrabold ${plan === 'tradicional' ? 'text-amber-700' : 'text-slate-800'}`}>{ultimo}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Botón CTA */}
                    <button className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 group active:scale-[0.99]">
                        <span>Confirmar Préstamo</span>
                        <ChevronRight className="group-hover:translate-x-1 transition-transform text-emerald-400" />
                    </button>

                </div>
            </div>
        </div>
    );
}
