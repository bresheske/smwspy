/**
 * File contains lots of fun stuff specifically for SMW.
 * Only really aims to support RetroArch + Snes9x Core.
 */
const memoryjs = require('memoryjs');

/**
 * This fun little guy converts an address found in the MemoryMap of SMWCentral into
 * an address that actually exists in our running application.
 */
 const convertSMWCentralAddressToReal = (proc, smwAddress) => {
    // we know how to gather the correct address for mario's powerup location.
    // we can use to this calculate an offset that we can then use for future
    // addresses. might be a bit inefficient, but should work.
    // here we just read in the address location to the powerup status.
    const pointerToData = memoryjs.readBuffer(proc.handle, proc.baseAddress + 0x36E5A0, 4).readIntLE(0, 4);

    const actualPowerupAddress = pointerToData + 0x19;

    // we have the actual (real) powerup address.  we can just calculate the offset from here.
    // formula is RealAddress = SMWCentralAddress + Offset
    const smwOffset = actualPowerupAddress - 0x007E0019;

    // we caculated the offset, so now we just need to add that to the given
    // address and that should handle our conversion correctly.
    return smwAddress + smwOffset;
};

/**
 * Opens process and returns both the baseAddress and the handle.
 * Keep the output - generally only really need to call this once.
 */
const openProcess = () => {
    try {
        const snesId = memoryjs
            .getProcesses()
            .find(proc => proc.szExeFile.includes('retroarch'))
            .th32ProcessID;
        const process = memoryjs.openProcess(snesId);
        const handle = process.handle;
    
        const snesMod = memoryjs.getModules(snesId)
            .find(mod => mod.szModule.includes('snes9x_libretro'));
        const baseAddress = snesMod.modBaseAddr;
        return {
            handle,
            baseAddress
        };
    }
    catch {
        return null;
    }
};

const readHexString = (proc, smwAddress, length, offsetAddress) => {
    // smwAddress is a string, so we convert it.
    const addr = Number(smwAddress);
    let address = convertSMWCentralAddressToReal(proc, addr);
    if (offsetAddress) {
        // if we have an offset, we need to read the offset address to gather our
        // offset. this is used in things like sprite tables.
        const offsetAddr = Number(offsetAddress);
        const offsetActual = convertSMWCentralAddressToReal(proc, offsetAddr);
        // read the offset. should just be one byte.
        const offsetAmount = memoryjs.readBuffer(proc.handle, offsetActual, 1).readIntLE(0, 1);
        // add it to our address.
        address += offsetAmount;
    }
    return memoryjs.readBuffer(proc.handle, address, length).toString('hex');
};

module.exports = {
    openProcess,
    convertSMWCentralAddressToReal,
    readHexString
}