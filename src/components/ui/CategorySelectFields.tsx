"use client";

import { useEffect, useMemo, useState } from "react";

export const CATEGORY_OTHER_VALUE = "__other__";

type Props = {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
  inputClass: string;
  labelClass: string;
  id?: string;
};

export default function CategorySelectFields({
  categories,
  value,
  onChange,
  inputClass,
  labelClass,
  id = "ad-category",
}: Props) {
  const options = useMemo(
    () => categories.filter((name) => name !== "Diğer"),
    [categories],
  );
  const [categorySelect, setCategorySelect] = useState("");
  const categoryIsOther = categorySelect === CATEGORY_OTHER_VALUE;

  useEffect(() => {
    if (!value) {
      setCategorySelect((prev) => (prev === CATEGORY_OTHER_VALUE ? prev : ""));
      return;
    }
    if (options.includes(value)) {
      setCategorySelect(value);
    } else {
      setCategorySelect(CATEGORY_OTHER_VALUE);
    }
  }, [value, options]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        Kategori
      </label>
      <select
        id={id}
        className={inputClass}
        value={categorySelect}
        onChange={(e) => {
          const next = e.target.value;
          setCategorySelect(next);
          onChange(next === CATEGORY_OTHER_VALUE ? "" : next);
        }}
        required={!categoryIsOther}
      >
        <option value="">Kategori seçin</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={CATEGORY_OTHER_VALUE}>Diğer</option>
      </select>
      {categoryIsOther ? (
        <input
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Kategori adını yazın"
          required
        />
      ) : null}
    </div>
  );
}
