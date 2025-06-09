import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll
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

const translations = {
  fr: {
    title: "Inventaire des spas",
    filter: "Filtrer par couleur...",
    manufacturer: "Fabricant",
    dimensions: "Dimensions",
    seats: "Places",
    coverQuality: "Qualité de la couverture",
    coverColor: "Couleur de la couverture",
    pumps: "Pompes",
    mainLight: "Lumière principale",
    smallLights: "Petites lumières",
    frameStatus: "Cadre",
    heater: "Chauffage",
    condition: "État",
    price: "Prix",
    delete: "Supprimer",
    edit: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
    total: "Total",
    photos: "Photos"
  },
  uk: {
    title: "Список СПА",
    filter: "Фільтр за кольором...",
    manufacturer: "Виробник",
    dimensions: "Розміри",
    seats: "Кількість місць",
    coverQuality: "Якість покриття",
    coverColor: "Колір покриття",
    pumps: "Кількість насосів",
    mainLight: "Основне світло",
    smallLights: "Малі світла",
    frameStatus: "Каркас",
    heater: "Нагрівач",
    condition: "Стан",
    price: "Ціна",
    delete: "Видалити",
    edit: "Редагувати",
    save: "Зберегти",
    cancel: "Скасувати",
    total: "Всього",
    photos: "Фотографії"
  }
};

export default function SpaInventory() {
  const [spas, setSpas] = useState([]);
  const [lang, setLang] = useState("uk");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [editingSpaId, setEditingSpaId] = useState(null);
  const [editData, setEditData] = useState({});
  const [images, setImages] = useState({});

  const t = translations[lang];

  useEffect(() => {
    const unsubscribe = onSnapshot(spasCollection, async (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSpas(data);

      // Завантажити фото для кожного SPA
      const allImages = {};
      for (const spa of data) {
        const folderRef = ref(storage, `spa_images/${spa.id}`);
        try {
          const files = await listAll(folderRef);
          const urls = await Promise.all(files.items.map((item) => getDownloadURL(item)));
          allImages[spa.id] = urls;
        } catch {
          allImages[spa.id] = [];
        }
      }
      setImages(allImages);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e, spaId) => {
    const files = e.target.files;
    if (!files.length) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileRef = ref(storage, `spa_images/${spaId}/${file.name}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });

    const newUrls = await Promise.all(uploadPromises);
    setImages((prev) => ({
      ...prev,
      [spaId]: [...(prev[spaId] || []), ...newUrls]
    }));
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const startEditing = (spa) => {
    setEditingSpaId(spa.id);
    setEditData(spa);
  };

  const cancelEditing = () => {
    setEditingSpaId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      const docRef = doc(db, "spas", editingSpaId);
      await updateDoc(docRef, editData);
      cancelEditing();
    } catch (err) {
      console.error("Помилка при оновленні:", err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Ви впевнені, що хочете видалити цей SPA?")) {
      const docRef = doc(db, "spas", id);
      await deleteDoc(docRef);
    }
  };

  const filteredSpas = spas.filter((spa) =>
    (!filterStatus || spa.status === filterStatus) &&
    (!filterColor || spa.coverColor?.toLowerCase().includes(filterColor.toLowerCase()))
  );
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{t.title}</h1>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="uk">🇺🇦 Українська</option>
          <option value="fr">🇫🇷 Français</option>
        </select>
      </div>

      <div style={{ margin: "1rem 0", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Всі статуси</option>
          <option value="не продано">Не продано</option>
          <option value="зарезервовано">Зарезервовано</option>
          <option value="на ремонті">На ремонті</option>
          <option value="продано">Продано</option>
        </select>

        <input
          type="text"
          placeholder={t.filter}
          value={filterColor}
          onChange={(e) => setFilterColor(e.target.value)}
        />

        <div style={{ fontWeight: "bold" }}>{t.total}: {filteredSpas.length}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
        {filteredSpas.map((spa) => (
          <div key={spa.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem" }}>
            {editingSpaId === spa.id ? (
              <>
                {["manufacturer", "dimensions", "seats", "coverQuality", "coverColor", "pumps", "frameStatus", "heater", "price"].map((field) => (
                  <div key={field}>
                    <label><strong>{t[field] || field}:</strong></label>
                    <input
                      type="text"
                      value={editData[field] || ""}
                      onChange={(e) => handleEditChange(field, e.target.value)}
                      style={{ width: "100%", marginBottom: "0.5rem" }}
                    />
                  </div>
                ))}

                {/* Select for status */}
                <div>
                  <label><strong>{t.condition}:</strong></label>
                  <select
                    value={editData.status || ""}
                    onChange={(e) => handleEditChange("status", e.target.value)}
                    style={{ width: "100%", marginBottom: "0.5rem" }}
                  >
                    <option value="">---</option>
                    <option value="не продано">Не продано</option>
                    <option value="зарезервовано">Зарезервовано</option>
                    <option value="на ремонті">На ремонті</option>
                    <option value="продано">Продано</option>
                  </select>
                </div>

                <button onClick={saveEdit} style={{ marginRight: "0.5rem" }}>{t.save}</button>
                <button onClick={cancelEditing}>{t.cancel}</button>
              </>
            ) : (
              <>
                <p><strong>{t.manufacturer}:</strong> {spa.manufacturer}</p>
                <p><strong>{t.dimensions}:</strong> {spa.dimensions}</p>
                <p><strong>{t.seats}:</strong> {spa.seats}</p>
                <p><strong>{t.coverQuality}:</strong> {spa.coverQuality}</p>
                <p><strong>{t.coverColor}:</strong> {spa.coverColor}</p>
                <p><strong>{t.pumps}:</strong> {spa.pumps}</p>
                <p><strong>{t.mainLight}:</strong> {spa.mainLight ? "✔️" : "❌"}</p>
                <p><strong>{t.smallLights}:</strong> {spa.smallLights ? "✔️" : "❌"}</p>
                <p><strong>{t.frameStatus}:</strong> {spa.frameStatus}</p>
                <p><strong>{t.heater}:</strong> {spa.heater}</p>
                <p><strong>{t.condition}:</strong> {spa.status}</p>
                <p><strong>{t.price}:</strong> ${spa.price}</p>

                {/* Фотографії */}
                <div>
                  <strong>{t.photos}:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {(images[spa.id] || []).map((url, i) => (
                      <img key={i} src={url} alt="spa" style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "4px" }} />
                    ))}
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleImageUpload(e, spa.id)}
                    style={{ marginTop: "0.5rem" }}
                  />
                </div>

                <button onClick={() => startEditing(spa)} style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}>
                  {t.edit}
                </button>
                <button
                  onClick={() => handleDelete(spa.id)}
                  style={{ marginTop: "0.5rem", background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
                >
                  {t.delete}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
