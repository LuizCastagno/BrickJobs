import React, { useState } from 'react';
import { LocateFixed, MapPin, Search, X } from 'lucide-react';
import { RONDONOPOLIS_REGIONS } from '../data/rondonopolisSeed';
import { resolveNearestRondonopolisRegion } from '../utils/duration';

interface LocationRegionBarProps {
  selectedRegion: string;
  onChangeRegion: (region: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  searchPlaceholder?: string;
  regionLabel?: string;
}

export const LocationRegionBar: React.FC<LocationRegionBarProps> = ({
  selectedRegion,
  onChangeRegion,
  searchQuery,
  onChangeSearchQuery,
  searchPlaceholder = 'Buscar por função ou empresa (ex: Pedreiro)',
  regionLabel = 'Região de interesse em Rondonópolis-MT',
}) => {
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [locating, setLocating] = useState(false);

  const handleUseLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('Geolocalização indisponível neste dispositivo. Selecione o bairro manualmente.');
      return;
    }

    setLocating(true);
    setGeoStatus('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = resolveNearestRondonopolisRegion(
          position.coords.latitude,
          position.coords.longitude
        );
        onChangeRegion(nearest);
        setGeoStatus(`Localização identificada: ${nearest}`);
        setLocating(false);
      },
      () => {
        setGeoStatus('Não foi possível acessar o GPS. Selecione a região desejada na lista.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  return (
    <section
      aria-label="Localização e filtros de busca"
      className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
        {/* Region of interest selector */}
        <div className="md:col-span-5">
          <label
            htmlFor="brickjobs-region-select"
            className="block text-xs font-semibold text-[#374151] mb-1.5"
          >
            {regionLabel}
          </label>
          <div className="relative">
            <MapPin
              className="w-4 h-4 text-[#C93B1E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <select
              id="brickjobs-region-select"
              value={selectedRegion}
              onChange={(e) => {
                onChangeRegion(e.target.value);
                setGeoStatus('');
              }}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
            >
              {RONDONOPOLIS_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search query */}
        <div className="md:col-span-4">
          <label
            htmlFor="brickjobs-search-input"
            className="block text-xs font-semibold text-[#374151] mb-1.5"
          >
            Filtrar por função ou palavra-chave
          </label>
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="brickjobs-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#C93B1E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* GPS quick button */}
        <div className="md:col-span-3">
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locating}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-sm font-medium text-[#111827] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <LocateFixed className="w-4 h-4 text-[#C93B1E] shrink-0" aria-hidden="true" />
            <span>{locating ? 'Localizando...' : 'Minha localização'}</span>
          </button>
        </div>
      </div>

      {geoStatus && (
        <p className="mt-2.5 text-xs text-[#4B5563]" role="status">
          {geoStatus}
        </p>
      )}
    </section>
  );
};
