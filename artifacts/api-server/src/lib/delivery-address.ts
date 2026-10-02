export function formatDeliveryAddress(address: string | null | undefined, deliveryAreaName?: string | null) {
    const freeTextAddress = address?.trim() ?? "";
    const areaName = deliveryAreaName?.trim() ?? "";
    if (!areaName) return freeTextAddress;
    if (!freeTextAddress) return areaName;
    const addressLower = freeTextAddress.toLocaleLowerCase();
    const areaLower = areaName.toLocaleLowerCase();
    if (addressLower === areaLower || addressLower.endsWith(`, ${areaLower}`)) return freeTextAddress;
    return `${freeTextAddress}, ${areaName}`;
  }