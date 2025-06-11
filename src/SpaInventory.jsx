import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: "AIzaSyDE2RbPr7wEOSV8t0f9QDwjHClI0wOhXAQ",
  authDomain: "spa-inventory-53969.firebaseapp.com",
  projectId: "spa-inventory-53969",
  storageBucket: "spa-inventory-53969.appspot.com",
  messagingSenderId: "114893907255",
  appId: "1:114893907255:web:8c7450935b39f9fb9d66b2",
  measurementId: "G-KHDD4B3GPB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const spasCollection = collection(db, "spas");

const translations = {
  fr: {
    title: "Inventaire des spas",
    manufacturer: "Fabricant",
    dimensions: "Dimensions",
    seats: "Places",
    coverQuality: "Qualité de la couverture",
    coverColor: "Couleur de la couverture",
    pumps: "Pompes (eau)",
    blower: "Souffleur d'air",
    mainLight: "Lumière principale",
    smallLights: "Petites lumières",
    frameStatus: "Cadre",
    heater: "Chauffage",
    condition: "État",
    price: "Prix",
    status: "Statut",
    note: "Remarques",
    uploadPhoto: "Ajouter des photos",
    statusOptions: {
      sold: "Vendu",
      reserved: "Réservé",
      repair: "En réparation",
      available: "Non vendu"
    }
  },
  uk: {
    title: "Список СПА",
    manufacturer: "Виробник",
    dimensions: "Розміри",
    seats: "Кількість місць",
    coverQuality: "Якість покриття",
    coverColor: "Колір покриття",
    pumps: "Кількість насосів (водяних)",
    blower: "Повітряний нагнітач",
    mainLight: "Основне світло",
    smallLights: "Малі світла",
    frameStatus: "Стан каркасу",
    heater: "Нагрівач",
    condition: "Стан",
    price: "Ціна",
    status: "Статус",
    note: "Нотатка",
    uploadPhoto: "Додати фото",
    statusOptions: {
      sold: "Продано",
      reserved: "Резерв",
      repair: "В ремонті",
      available: "Не продано"
    }
  }
};

export default function SpaInventory() {
  const [spas, setSpas] = useState([]);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "uk");
  const t = translations[lang];

  useEffect(() => {
    const unsubscribe = onSnapshot(spasCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSpas(data);
    });
    return () => unsubscribe();
  }, []);

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    localStorage.setItem("lang", newLang);
    setLang(newLang);
  };

  const handleStatusChange = async (id, status) => {
    const refDoc = doc(db, "spas", id);
    await updateDoc(refDoc, { status });
  };

  const handleNoteChange = async (id, note) => {
    const refDoc = doc(db, "spas", id);
    await updateDoc(refDoc, { note });
  };

  const handleUpload = async (id, files) => {
    const uploaded = [];
    for (const file of files) {
      const fileRef = ref(storage, `spas/${id}/${uuidv4()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      uploaded.push(url);
    }
    const refDoc = doc(db, "spas", id);
    const spa = spas.find((s) => s.id === id);
    await updateDoc(refDoc, { photos: [...(spa.photos || []), ...uploaded] });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{t.title}</h1>
        <select value={lang} onChange={handleLangChange}>
          <option value="uk">🇺🇦 Українська</option>
          <option value="fr">🇫🇷 Français</option>
        </select>
      </div>

      <div style={{ display: "flex", overflowX: "auto", gap: "1rem", marginTop: "1rem" }}>
        {spas.map((spa) => (
          <div
            key={spa.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              minWidth: "320px"
            }}
          >
            <p><strong>{t.manufacturer}:</strong> {spa.manufacturer}</p>
            <p><strong>{t.dimensions}:</strong> {spa.dimensions}</p>
            <p><strong>{t.seats}:</strong> {spa.seats}</p>
            <p><strong>{t.coverQuality}:</strong> {spa.coverQuality}</p>
            <p><strong>{t.coverColor}:</strong> {spa.coverColor}</p>
            <p><strong>{t.pumps}:</strong> {spa.pumps}</p>
            <p><strong>{t.blower}:</strong> {spa.blower}</p>
            <p><strong>{t.mainLight}:</strong> {spa.mainLight ? "✔️" : "❌"}</p>
            <p><strong>{t.smallLights}:</strong> {spa.smallLights ? "✔️" : "❌"}</p>
            <p><strong>{t.frameStatus}:</strong> {spa.frameStatus}</p>
            <p><strong>{t.heater}:</strong> {spa.heater}</p>
            <p><strong>{t.condition}:</strong> {spa.condition}</p>
            <p><strong>{t.price}:</strong> ${spa.price}</p>

            <p><strong>{t.status}:</strong>
              <select
                value={spa.status}
                onChange={(e) => handleStatusChange(spa.id, e.target.value)}
              >
                <option value="sold">{t.statusOptions.sold}</option>
                <option value="reserved">{t.statusOptions.reserved}</option>
                <option value="repair">{t.statusOptions.repair}</option>
                <option value="available">{t.statusOptions.available}</option>
              </select>
            </p>

            <p><strong>{t.note}:</strong></p>
            <textarea
              rows={2}
              defaultValue={spa.note || ""}
              onBlur={(e) => handleNoteChange(spa.id, e.target.value)}
              style={{ width: "100%" }}
            />

            <div style={{ marginTop: "0.5rem" }}>
              <strong>{t.uploadPhoto}:</strong>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(spa.id, e.target.files)}
              />
              <div style={{ display: "flex", gap: "5px", marginTop: "5px", flexWrap: "wrap" }}>
                {(spa.photos || []).map((url, index) => (
                  <img key={index} src={url} alt={`spa-${index}`} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
