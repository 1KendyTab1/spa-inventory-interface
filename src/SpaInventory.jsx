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

export default function SpaInventory() {
  const [spas, setSpas] = useState([]);
  const [lang, setLang] = useState("uk");

  const translations = {
    uk: {
      title: "Список СПА",
      addPhotos: "Додати фото",
      uploading: "Завантаження...",
      noPhotos: "Немає фото"
    },
    fr: {
      title: "Inventaire des spas",
      addPhotos: "Ajouter des photos",
      uploading: "Téléchargement...",
      noPhotos: "Pas de photos"
    }
  };

  const t = translations[lang];

  useEffect(() => {
    const unsubscribe = onSnapshot(spasCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSpas(data);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = async (e, spaId) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const urls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileRef = ref(storage, `spas/${spaId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }

    const spaDoc = doc(db, "spas", spaId);
    await updateDoc(spaDoc, {
      images: urls // або [...(spa.images || []), ...urls] щоб не стерти попередні
    });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>{t.title}</h1>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="uk">🇺🇦 Українська</option>
          <option value="fr">🇫🇷 Français</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {spas.map((spa) => (
          <div key={spa.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem" }}>
            <h3>{spa.manufacturer || "SPA"}</h3>
            <p><strong>Розміри:</strong> {spa.dimensions}</p>
            <p><strong>Ціна:</strong> {spa.price}</p>

            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, spa.id)}
              />
              <p style={{ fontStyle: "italic", color: "#555" }}>{t.addPhotos}</p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", marginTop: "0.5rem" }}>
              {spa.images?.length > 0 ? (
                spa.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`spa-${spa.id}-${i}`}
                    style={{ height: "80px", borderRadius: "4px", cursor: "pointer" }}
                    onClick={() => window.open(url, "_blank")}
                  />
                ))
              ) : (
                <span>{t.noPhotos}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
