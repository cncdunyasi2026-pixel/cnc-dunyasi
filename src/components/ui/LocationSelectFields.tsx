"use client";

import { useEffect, useState } from "react";
import type { LocationSelection } from "@/lib/locations/types";
import { useLocationOptions } from "@/hooks/useLocationOptions";

const defaultInputClass =
  "h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15";

const defaultLabelClass = "mb-1 block text-xs font-semibold text-[#61748f]";

type Props = {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  inputClass?: string;
  labelClass?: string;
  required?: boolean;
};

export default function LocationSelectFields({
  value,
  onChange,
  inputClass = defaultInputClass,
  labelClass = defaultLabelClass,
  required = true,
}: Props) {
  const {
    provinces,
    districts,
    neighborhoods,
    loadingProvinces,
    loadingDistricts,
    loadingNeighborhoods,
    error,
    loadDistricts,
    loadNeighborhoods,
  } = useLocationOptions();

  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");

  useEffect(() => {
    if (!value.city || provinces.length === 0 || provinceId) return;
    const match = provinces.find((item) => item.name === value.city);
    if (match) {
      setProvinceId(match.id);
      loadDistricts(match.id);
    }
  }, [value.city, provinces, provinceId, loadDistricts]);

  useEffect(() => {
    if (!value.district || districts.length === 0 || districtId) return;
    const match = districts.find((item) => item.name === value.district);
    if (match) {
      setDistrictId(match.id);
      loadNeighborhoods(match.id);
    }
  }, [value.district, districts, districtId, loadNeighborhoods]);

  useEffect(() => {
    if (!value.neighborhood || neighborhoods.length === 0 || neighborhoodId) return;
    const match = neighborhoods.find((item) => item.label === value.neighborhood);
    if (match) {
      setNeighborhoodId(match.id);
    }
  }, [value.neighborhood, neighborhoods, neighborhoodId]);

  const handleProvinceChange = (nextProvinceId: string) => {
    setProvinceId(nextProvinceId);
    setDistrictId("");
    setNeighborhoodId("");

    const province = provinces.find((item) => item.id === nextProvinceId);
    onChange({
      city: province?.name ?? "",
      district: "",
      neighborhood: "",
    });
    loadDistricts(nextProvinceId);
  };

  const handleDistrictChange = (nextDistrictId: string) => {
    setDistrictId(nextDistrictId);
    setNeighborhoodId("");

    const district = districts.find((item) => item.id === nextDistrictId);
    onChange({
      city: value.city,
      district: district?.name ?? "",
      neighborhood: "",
    });
    loadNeighborhoods(nextDistrictId);
  };

  const handleNeighborhoodChange = (nextNeighborhoodId: string) => {
    setNeighborhoodId(nextNeighborhoodId);
    const neighborhood = neighborhoods.find((item) => item.id === nextNeighborhoodId);
    onChange({
      city: value.city,
      district: value.district,
      neighborhood: neighborhood?.label ?? "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="location-province" className={labelClass}>
            İl
          </label>
          <select
            id="location-province"
            className={inputClass}
            value={provinceId}
            onChange={(event) => handleProvinceChange(event.target.value)}
            required={required}
            disabled={loadingProvinces}
          >
            <option value="">{loadingProvinces ? "Yükleniyor..." : "İl seçin"}</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location-district" className={labelClass}>
            İlçe
          </label>
          <select
            id="location-district"
            className={inputClass}
            value={districtId}
            onChange={(event) => handleDistrictChange(event.target.value)}
            required={required}
            disabled={!provinceId || loadingDistricts}
          >
            <option value="">
              {!provinceId ? "Önce il seçin" : loadingDistricts ? "Yükleniyor..." : "İlçe seçin"}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location-neighborhood" className={labelClass}>
            Mahalle / Köy
          </label>
          <select
            id="location-neighborhood"
            className={inputClass}
            value={neighborhoodId}
            onChange={(event) => handleNeighborhoodChange(event.target.value)}
            required={required}
            disabled={!districtId || loadingNeighborhoods}
          >
            <option value="">
              {!districtId
                ? "Önce ilçe seçin"
                : loadingNeighborhoods
                  ? "Yükleniyor..."
                  : "Mahalle / köy seçin"}
            </option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
      ) : null}
    </div>
  );
}
