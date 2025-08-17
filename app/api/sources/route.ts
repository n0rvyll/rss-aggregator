import { NextResponse } from "next/server";

export async function GET() {
  const sources = [
    { id: "24hu", name: "24", url: "https://24.hu" },
    { id: "444", name: "444.hu", url: "https://444.hu" },
    { id: "atlatszo", name: "Átlátszó", url: "https://atlatszo.hu" },
    { id: "forbes", name: "Forbes", url: "https://forbes.hu" },
    { id: "g7", name: "G7", url: "https://g7.hu" },
    { id: "lakmusz", name: "Lakmusz", url: "https://lakmusz.hu" },
    { id: "narancs", name: "Magyar Narancs", url: "https://magyarnarancs.hu" },
    { id: "media1", name: "Media1", url: "https://media1.hu" },
    { id: "merce", name: "Mérce", url: "https://merce.hu" },
    { id: "mfor", name: "Menedzsment Fórum", url: "https://mfor.hu" },
    { id: "nepszava", name: "Népszava", url: "https://nepszava.hu" },
    { id: "qubit", name: "Qubit", url: "https://qubit.hu" },
    { id: "raketa", name: "Rakéta", url: "https://raketa.hu" },
    { id: "rtl", name: "RTL", url: "https://rtl.hu" },
    { id: "ignhu", name: "IGN Hungary", url: "https://hu.ign.com/" },
    {
      id: "szabadeuropa",
      name: "Szabad Európa",
      url: "https://www.szabadeuropa.hu",
    },
    { id: "telex", name: "Telex", url: "https://telex.hu" },
    { id: "transelex", name: "Transtelex", url: "https://transtelex.ro" },
    {
      id: "valaszonline",
      name: "Válasz Online",
      url: "https://www.valaszonline.hu",
    },
    {
      id: "guardian",
      name: "The Guardian",
      url: "https://www.theguardian.com",
    },
    {
      id: "jogaszvilag",
      name: "Jogászvilág",
      url: "https://www.jogaszvilag.hu",
    },
    {
      id: "portfolio",
      name: "Portfolio",
      url: "https://www.portfolio.hu",
    },

    {
      id: "hwsw",
      name: "HWSW",
      url: "https://www.hwsw.hu",
    },
  ];
  return NextResponse.json({ sources });
}
