import React, { useState } from 'react';
import { ArrowRight, Building2, HardHat, MapPin } from 'lucide-react';
import type { UserRole } from '../types/brickjobs';
import { BrickLogo } from './BrickLogo';

interface CoverScreenProps {
  onSelectRole: (role: UserRole) => void;
  openVacanciesCount: number;
  companiesCount: number;
  workersCount: number;
}

const COVER_HERO_SRC = '/src/assets/images/brickjobs_cover_hero_1794693694488.jpg';

export const CoverScreen: React.FC<CoverScreenProps> = ({
  onSelectRole,
  openVacanciesCount,
  companiesCount,
  workersCount,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#111827] flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          <a href="#inicio" className="focus-visible:outline-2 focus-visible:outline-[#C93B1E] rounded-md">
            <BrickLogo />
          </a>

          <nav aria-label="Navegação inicial" className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5563]">
            <button
              type="button"
              onClick={() => onSelectRole('contratante')}
              className="hover:text-[#111827] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Para Construtoras
            </button>
            <button
              type="button"
              onClick={() => onSelectRole('contratado')}
              className="hover:text-[#111827] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Para Trabalhadores
            </button>
            <a
              href="#como-funciona"
              className="hover:text-[#111827] transition-colors whitespace-nowrap shrink-0"
            >
              Como funciona
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onSelectRole('contratado')}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver vagas
            </button>
          </div>
        </div>
      </header>

      {/* Main Cover Content */}
      <main id="inicio" className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-10 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
            {/* Left Column: Brand pitch + Two Entry Tabs */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4B5563] mb-3">
                  <MapPin className="w-4 h-4 text-[#C93B1E]" aria-hidden="true" />
                  <span>Rondonópolis e região, Mato Grosso</span>
                </p>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827] leading-[1.12] [text-wrap:balance]">
                  Obra certa encontra profissional pronto, no bairro certo.
                </h1>

                <p className="mt-4 text-base sm:text-lg text-[#4B5563] max-w-2xl leading-relaxed">
                  O BrickJobs conecta construtoras que precisam contratar e trabalhadores da construção civil em Rondonópolis-MT, sem complicação.
                </p>
              </div>

              {/* Two Primary Entry Tabs */}
              <div className="mt-7 sm:mt-8">
                <p className="text-sm font-semibold text-[#111827] mb-3">
                  Escolha seu perfil de entrada
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tab 1: Contratante */}
                  <button
                    type="button"
                    onClick={() => onSelectRole('contratante')}
                    data-testid="enter-contratante"
                    className="group text-left bg-white border border-[#E5E7EB] hover:border-[#111827] rounded-2xl p-5 transition-all shadow-xs hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#C93B1E] min-h-[140px] flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-11 h-11 rounded-xl bg-[#111827] text-white flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-medium text-[#4B5563]">
                        Empresa
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display text-lg font-bold text-[#111827]">
                          Contratante
                        </h2>
                        <ArrowRight
                          className="w-5 h-5 text-[#4B5563] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-transform"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-sm text-[#4B5563] leading-snug">
                        Sou construtora: cadastrar empresa, informar funções e quantidade de vagas.
                      </p>
                    </div>
                  </button>

                  {/* Tab 2: Contratado */}
                  <button
                    type="button"
                    onClick={() => onSelectRole('contratado')}
                    data-testid="enter-contratado"
                    className="group text-left bg-[#C93B1E] border border-[#C93B1E] hover:bg-[#B23319] text-white rounded-2xl p-5 transition-all shadow-xs hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#111827] min-h-[140px] flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
                        <HardHat className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-medium text-white/90">
                        Colaborador
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display text-lg font-bold text-white">
                          Contratado
                        </h2>
                        <ArrowRight
                          className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-sm text-white/90 leading-snug">
                        Busco emprego: anexar PDF ou montar experiências, gerar perfil e ver vagas.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Construction Image */}
            <div className="lg:col-span-5">
              <div className="h-52 sm:h-64 lg:h-full min-h-[220px] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#1F2937] relative">
                {!heroImgFailed ? (
                  <img
                    src={COVER_HERO_SRC}
                    alt="Equipe de construção civil analisando projeto arquitetônico em obra de alvenaria estrutural"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1F2937] to-[#111827] flex flex-col items-center justify-center p-6 text-center text-white">
                    <Building2 className="w-10 h-10 text-[#C93B1E] mb-2" aria-hidden="true" />
                    <p className="font-display text-lg font-semibold">Canteiro BrickJobs</p>
                    <p className="text-sm text-white/75 mt-1">Rondonópolis - MT</p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 sm:p-5">
                  <p className="text-xs sm:text-sm font-medium text-white">
                    Alvenaria · Estrutura · Instalações · Acabamento
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column regional summary strip */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-[#E5E7EB] pt-6">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tabular-nums">
                {openVacanciesCount}
              </p>
              <p className="text-sm text-[#4B5563] mt-0.5">
                Vagas abertas agora
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tabular-nums">
                {companiesCount}
              </p>
              <p className="text-sm text-[#4B5563] mt-0.5">
                Construtoras na rede
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tabular-nums">
                {workersCount}
              </p>
              <p className="text-sm text-[#4B5563] mt-0.5">
                Perfis de profissionais
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tabular-nums">
                11+
              </p>
              <p className="text-sm text-[#4B5563] mt-0.5">
                Bairros e regiões de MT
              </p>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section id="como-funciona" className="bg-white border-t border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#111827]">
              Como o BrickJobs funciona na prática
            </h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-semibold text-[#C93B1E]">01. Para o Contratante</p>
                <p className="mt-1.5 text-sm text-[#4B5563] leading-relaxed">
                  Cadastre sua construtora com dados gerais e registre a busca por função e quantidade exata de vagas abertas.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#C93B1E]">02. Para o Contratado</p>
                <p className="mt-1.5 text-sm text-[#4B5563] leading-relaxed">
                  Anexe seu currículo em PDF ou preencha as sub-abas de experiências com datas para gerar seu perfil completo com tempo de atuação.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#C93B1E]">03. Localização em Rondonópolis</p>
                <p className="mt-1.5 text-sm text-[#4B5563] leading-relaxed">
                  Defina seu bairro ou região de interesse para encontrar vagas próximas da sua casa ou do canteiro de obras.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
