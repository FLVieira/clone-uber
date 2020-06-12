import React, { useEffect, useState, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { PermissionsAndroid, Alert, Image } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
Geocoder.init('YOUR_SECRET_API');

import Search from '~/components/Search';
import Directions from '~/components/Directions';
import Details from '~/components/Details';

import {
  Container,
  LocationBox,
  LocationText,
  LocationTimeBox,
  LocationTimeText,
  LocationTimeTextSmall,
  Back,
} from './styles';

import { getPixelSize } from '~/util';

import markerImage from '~/assets/marker.png';
import backImage from '~/assets/back.png';

export default function Map() {
  const [region, setRegion] = useState(null);
  const [destination, setDestination] = useState(null);
  const [duration, setDuration] = useState(null);
  const [location, setLocation] = useState('');
  let mapRef = useRef(null);

  useEffect(() => {
    async function checkPermission() {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude } }) => {
              const response = await Geocoder.from({ latitude, longitude });
              const address = response.results[0].formatted_address;
              const locationAdress = address.substring(0, address.indexOf(','));

              setLocation(locationAdress);
              setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0143,
                longitudeDelta: 0.0134,
              });
            },
            (error) => {
              Alert.alert(
                'Erro desconhecido',
                'Ocorreu um erro ao carregar sua localização'
              );
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          Alert.alert(
            'Permissão negada.',
            'O app não irá funcionar corretamente.'
          );
        }
      } catch (err) {
        console.warn(err);
      }
    }
    checkPermission();
  }, []);

  function handleLocationSelected(data, { geometry }) {
    const {
      location: { lat: latitude, lng: longitude },
    } = geometry;
    setDestination({
      latitude,
      longitude,
      title: data.structured_formatting.main_text,
    });
  }

  function handleBack() {
    setDestination(null);
  }

  return (
    <Container>
      <MapView
        style={{ flex: 1 }}
        region={region}
        showsUserLocation
        loadingEnabled
        ref={(el) => {
          mapRef = el;
        }}
      >
        {destination && (
          <>
            <Directions
              origin={region}
              destination={destination}
              onReady={(result) => {
                mapRef.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    right: getPixelSize(100),
                    left: getPixelSize(50),
                    top: getPixelSize(50),
                    bottom: getPixelSize(250),
                  },
                });
                // Quando o a linha abaixo é executada o fitToCoordinates funciona de maneira não esperada
                // setDuration(Math.floor(result.duration));
              }}
            />
            <Marker
              coordinate={destination}
              anchor={{ x: 0, y: 0 }}
              image={markerImage}
            >
              <LocationBox>
                <LocationText>{destination.title}</LocationText>
              </LocationBox>
            </Marker>

            <Marker coordinate={region} anchor={{ x: 0, y: 0 }}>
              <LocationBox>
                <LocationTimeBox>
                  <LocationTimeText>62</LocationTimeText>
                  <LocationTimeTextSmall>MIN</LocationTimeTextSmall>
                </LocationTimeBox>
                <LocationText>{location}</LocationText>
              </LocationBox>
            </Marker>
          </>
        )}
      </MapView>
      {destination ? (
        <>
          <Back onPress={handleBack}>
            <Image source={backImage} />
          </Back>
          <Details />
        </>
      ) : (
        <Search onLocationSelected={handleLocationSelected} />
      )}
    </Container>
  );
}
