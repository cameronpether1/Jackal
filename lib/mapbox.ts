export function getMapImageUrl(lat: number, lng: number, zoom = 13): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const style = process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? "mapbox/streets-v12";
  const pin = `pin-l+ee4444(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/${style}/static/${pin}/${lng},${lat},${zoom},0/576x360@2x?access_token=${token}`;
}
