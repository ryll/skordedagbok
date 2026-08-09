const CROP_NAMES: Record<string, string> = {
  Jorgubbe: "Jordgubbe",
  Jorgubb: "Jordgubbe",
  Rädia: "Rädisa",
  Örter: "Ört",
};

const VARIETY_NAMES: Record<string, string> = {
  Sonnenhertz: "Sonnenherz",
  Sonnenerz: "Sonnenherz",
  Sonnenherz: "Sonnenherz",
};

export function normalizeLabel(original: string): { cropType: string; variety: string | null } {
  const label = original.trim().replace(/""$/, '"');
  if (label === "Zucchini Gul - One Ball") return { cropType: "Zucchini", variety: "Gul One Ball" };
  if (label === 'Salladssenap "Purple Osaka"') return { cropType: "Salladssenap", variety: "Purple Osaka" };

  const delimiter = label.indexOf(" - ");
  let cropType = delimiter >= 0 ? label.slice(0, delimiter) : label;
  let variety = delimiter >= 0 ? label.slice(delimiter + 3) : null;
  cropType = cropType.replace(/^Jorgubbe(?=\/|$)/, "Jordgubbe").replace(/^Jorgubb(?=\/|$)/, "Jordgubbe");
  cropType = CROP_NAMES[cropType] ?? cropType;
  if (variety) variety = VARIETY_NAMES[variety] ?? variety;
  return { cropType, variety };
}
