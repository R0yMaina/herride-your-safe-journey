export function MapCanvas({ showRoute = false, className = "" }: { showRoute?: boolean; className?: string }) {
  // We use Nairobi as the base location. If showRoute is true, we can show a route (e.g. Nairobi to Westlands)
  const mapSrc = showRoute
    ? "https://maps.google.com/maps?q=Nairobi+to+Westlands&t=&z=13&ie=UTF8&iwloc=&output=embed"
    : "https://maps.google.com/maps?q=Nairobi&t=&z=13&ie=UTF8&iwloc=&output=embed";

  return (
    <div className={`relative w-full h-full overflow-hidden bg-noir ${className}`}>
      <iframe 
        title="Google Map"
        width="100%" 
        height="100%" 
        frameBorder="0" 
        scrolling="no" 
        marginHeight={0} 
        marginWidth={0} 
        src={mapSrc}
        className="absolute inset-0 w-full h-full"
        style={{ filter: "invert(90%) hue-rotate(180deg) contrast(100%) opacity(0.8)" }}
      />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]" />
    </div>
  );
}