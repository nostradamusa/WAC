type ProfileLocationSectionProps = {
  country: string;
  setCountry: React.Dispatch<React.SetStateAction<string>>;
  stateRegion: string;
  setStateRegion: React.Dispatch<React.SetStateAction<string>>;
  city: string;
  setCity: React.Dispatch<React.SetStateAction<string>>;
  ancestryCity: string;
  setAncestryCity: React.Dispatch<React.SetStateAction<string>>;
};

export default function ProfileLocationSection({
  country,
  setCountry,
  stateRegion,
  setStateRegion,
  city,
  setCity,
  ancestryCity,
  setAncestryCity,
}: ProfileLocationSectionProps) {
  return (
    <>
      <div>
        <label>Country</label>
        <br />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      <div>
        <label>State</label>
        <br />
        <input
          value={stateRegion}
          onChange={(e) => setStateRegion(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      <div>
        <label>City</label>
        <br />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      <div>
        <label>Ancestry City</label>
        <br />
        <input
          value={ancestryCity}
          onChange={(e) => setAncestryCity(e.target.value)}
          placeholder="e.g. Struga, Shkoder, Prishtina"
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>
    </>
  );
}
