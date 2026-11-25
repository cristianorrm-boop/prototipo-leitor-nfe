const UF_POR_CODIGO = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
  21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL",
  28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR",
  42: "SC", 43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

function extrairChave(textoDecodificado) {
  const digitos = textoDecodificado.match(/\d{44}/);
  return digitos ? digitos[0] : null;
}

function formatarCnpj(cnpj) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function interpretarChave(chave) {
  const uf = UF_POR_CODIGO[Number(chave.slice(0, 2))] || "?";
  const ano = "20" + chave.slice(2, 4);
  const mes = chave.slice(4, 6);
  const cnpj = chave.slice(6, 20);
  const modelo = chave.slice(20, 22);
  const serie = chave.slice(22, 25);
  const numero = chave.slice(25, 34);
  const tipo = modelo === "65" ? "NFC-e (cupom/varejo)" : modelo === "55" ? "NF-e (nota completa)" : `Modelo ${modelo}`;

  return {
    tipo,
    uf,
    data: `${mes}/${ano}`,
    cnpj: formatarCnpj(cnpj),
    serie: `${Number(serie)} / ${Number(numero)}`,
    chave,
  };
}

function mostrarResultado(dados, bruto) {
  document.getElementById("r-tipo").textContent = dados.tipo;
  document.getElementById("r-uf").textContent = dados.uf;
  document.getElementById("r-data").textContent = dados.data;
  document.getElementById("r-cnpj").textContent = dados.cnpj;
  document.getElementById("r-serie").textContent = dados.serie;
  document.getElementById("r-chave").textContent = dados.chave;
  document.getElementById("raw").textContent = "QR bruto: " + bruto;
  document.getElementById("resultado").classList.add("ativo");
  document.getElementById("msg-erro").textContent = "";
}

let leitor = null;
let pausado = false;

function aoLer(textoDecodificado) {
  if (pausado) return;
  const chave = extrairChave(textoDecodificado);
  if (!chave) {
    document.getElementById("msg-erro").textContent = "QR Code lido, mas não parece ser de uma nota fiscal (sem chave de 44 dígitos).";
    return;
  }
  pausado = true;
  mostrarResultado(interpretarChave(chave), textoDecodificado);
  if (navigator.vibrate) navigator.vibrate(120);
  setTimeout(() => { pausado = false; }, 2500);
}

document.getElementById("btn-iniciar").addEventListener("click", async () => {
  document.getElementById("msg-erro").textContent = "";
  leitor = new Html5Qrcode("reader");
  try {
    await leitor.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 240 },
      aoLer,
      () => {}
    );
    document.getElementById("btn-iniciar").disabled = true;
    document.getElementById("btn-parar").disabled = false;
  } catch (e) {
    document.getElementById("msg-erro").textContent = "Não consegui acessar a câmera: " + e;
  }
});

document.getElementById("btn-parar").addEventListener("click", async () => {
  if (leitor) {
    await leitor.stop();
    leitor.clear();
  }
  document.getElementById("btn-iniciar").disabled = false;
  document.getElementById("btn-parar").disabled = true;
});
