 import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Complaint } from '@/services/api';
import { Link } from 'react-router-dom';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';

// Fix for default marker icon missing
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
   shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ComplaintMapProps {
  complaints: Complaint[];
  center?: [number, number];
  zoom?: number;
}

const MapEvents = () => {
  const map = useMap();
  // Force map resize updating when container changes
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
  return null;
};

const ComplaintMap = ({ complaints, center = [17.6599, 75.9064], zoom = 13 }: ComplaintMapProps) => {
  // Default center is Solapur given the context in Header.tsx (SMC Road Watch)
  
  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapEvents />
        <MarkerClusterGroup chunkedLoading>
        {complaints.map((complaint) => (
          <Marker 
            key={complaint.id} 
            position={[complaint.latitude || 0, complaint.longitude || 0]}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{complaint.damage_type || 'Road Damage'}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(complaint.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2 items-center mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    complaint.severity === 'High' ? 'bg-red-100 text-red-800' :
                    complaint.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {complaint.severity || 'Unknown'}
                  </span>
                  <span className="text-xs capitalize px-2 py-0.5 bg-gray-100 rounded-full">
                    {complaint.status}
                  </span>
                </div>
                {complaint.image_url && (
                  <div className="mb-2 h-24 w-full bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={complaint.image_url} 
                      alt="Damage" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Link 
                    to={`/track?id=${complaint.id}`}
                    className="text-xs text-primary hover:underline w-full text-center"
                  >
                    View Details
                  </Link>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs h-7 flex items-center justify-center gap-1"
                    onClick={() => {
                      // Open Google Maps directions in a new tab
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${complaint.latitude},${complaint.longitude}`, 
                        '_blank'
                      );
                    }}
                  >
                    <Navigation className="h-3 w-3" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
 
 export default ComplaintMap;