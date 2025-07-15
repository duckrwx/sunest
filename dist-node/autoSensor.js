"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// sensor/autoSensor.ts
require("dotenv/config");
const ethers_1 = require("ethers");
// artefato compilado do seu Sunest.sol
const SunestJson = require('../artifacts/contracts/Sunest.sol/Sunest.json');
// variáveis de ambiente
const RPC_URL = process.env.RPC_URL;
const PK = process.env.PK;
const SUNEST_ADDR = process.env.VITE_SUNEST;
const LOOP_SECONDS = +process.env.LOOP_SECS;
// opcional: se definido, sempre envia para esse microgrid; senão pega o primeiro da lista
const FIXED_HASH = process.env.MGRID_HASH;
// provedor + signer
const provider = new ethers_1.JsonRpcProvider(RPC_URL);
const wallet = new ethers_1.Wallet(PK, provider);
// contrato Sunest
const sunest = new ethers_1.Contract(SUNEST_ADDR, SunestJson.abi, wallet);
// utilitário random
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function tick() {
    try {
        let hash = FIXED_HASH;
        if (!hash) {
            // pega todos e escolhe o primeiro (ou aleatório, se quiser)
            const all = await sunest.listMicrogrids();
            if (all.length === 0) {
                console.log('⚠️ Nenhum microgrid cadastrado ainda.');
                return;
            }
            hash = all[0];
        }
        const kWh = rand(50, 500); // valor aleatório de energia
        // SUBMIT SENSOR DATA (funciona no Sunest.sol)
        const tx = await sunest.submitSensorData(hash, kWh);
        console.log(`[${new Date().toISOString()}] Enviando kWh=${kWh} → tx ${tx.hash}`);
        await tx.wait();
        console.log('✔️ Concluído\n');
    }
    catch (err) {
        console.error('Erro no tick:', err.message || err);
    }
}
console.log(`🔄 Rodando sensor a cada ${LOOP_SECONDS}s…`);
tick(); // já dispara uma vez
setInterval(tick, LOOP_SECONDS * 1000);
