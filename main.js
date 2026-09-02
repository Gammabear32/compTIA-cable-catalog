import { supabase } from './supabaseClient.js';
import {
  fetchCables,
  fetchCableCategories,
  createCable
} from './db.js';

const catalogElement = document.getElementById('catalog');
const statusElement = document.getElementById('status');

const cableForm = document.getElementById('cable-form');

const bulkInput = document.getElementById('bulk-input');
const bulkImportButton = document.getElementById('bulk-import-button');

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

let allCables = [];


/* =========================================================
   STATUS
========================================================= */

const setStatus = (message, type = '') => {
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = `status-bar ${type}`.trim();
};


/* =========================================================
   HTML SAFETY
========================================================= */

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};


/* =========================================================
   CABLE CARDS
========================================================= */

const renderCables = (cables) => {
  if (!catalogElement) return;

  if (!cables || cables.length === 0) {
    catalogElement.innerHTML = `
      <p class="empty-state">
        No hay cables o conectores disponibles.
      </p>
    `;
    return;
  }

  catalogElement.innerHTML = cables
    .map((cable) => {
      const image =
        cable.image_url ||
        'https://placehold.co/800x500?text=Sin+Imagen';

      const connector = cable.connector_type
        ? `
          <span class="tag">
            ${escapeHtml(cable.connector_type)}
          </span>
        `
        : '';

      return `
        <article class="card">

          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(cable.name)}"
            loading="lazy"
          />

          <div class="card-body">

            <div class="card-meta">
              <span class="tag">
                ${escapeHtml(cable.category || 'Sin categoría')}
              </span>

              ${connector}
            </div>

            <h3>${escapeHtml(cable.name)}</h3>

            <p>
              ${escapeHtml(
                cable.description || 'No hay descripción disponible.'
              )}
            </p>

            ${
              cable.purpose
                ? `
                  <div class="cable-info">
                    <strong>Propósito:</strong>
                    <p>${escapeHtml(cable.purpose)}</p>
                  </div>
                `
                : ''
            }

            ${
              cable.features
                ? `
                  <div class="cable-info">
                    <strong>Características:</strong>
                    <p>${escapeHtml(cable.features)}</p>
                  </div>
                `
                : ''
            }

          </div>

        </article>
      `;
    })
    .join('');
};


/* =========================================================
   SEARCH AND FILTER
========================================================= */

const filterCatalog = () => {
  const search = searchInput
    ? searchInput.value.trim().toLowerCase()
    : '';

  const selectedCategory = categoryFilter
    ? categoryFilter.value
    : '';

  const filtered = allCables.filter((cable) => {
    const searchableText = `
      ${cable.name || ''}
      ${cable.category || ''}
      ${cable.connector_type || ''}
      ${cable.description || ''}
      ${cable.purpose || ''}
      ${cable.features || ''}
    `.toLowerCase();

    const matchesSearch =
      !search || searchableText.includes(search);

    const matchesCategory =
      !selectedCategory ||
      cable.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  renderCables(filtered);
};


/* =========================================================
   LOAD CATEGORIES
========================================================= */

const loadCategories = async () => {
  if (!categoryFilter) return;

  const { data, error } = await fetchCableCategories();

  if (error) {
    console.error('Error loading categories:', error);
    return;
  }

  categoryFilter.innerHTML = `
    <option value="">Todas las categorías</option>
  `;

  data.forEach((category) => {
    const option = document.createElement('option');

    option.value = category;
    option.textContent = category;

    categoryFilter.appendChild(option);
  });
};


/* =========================================================
   LOAD CATALOG
========================================================= */

const loadCatalog = async () => {
  setStatus('Cargando catálogo...', '');

  const { data, error } = await fetchCables({
    page: 1,
    pageSize: 100
  });

  if (error) {
    console.error(error);

    setStatus(
      'No se pudo cargar el catálogo. Verifica la conexión con Supabase.',
      'error'
    );

    if (catalogElement) {
      catalogElement.innerHTML = `
        <p class="empty-state">
          No se pudo cargar el catálogo.
        </p>
      `;
    }

    return;
  }

  allCables = data || [];

  filterCatalog();

  setStatus(
    `Catálogo cargado. ${allCables.length} elemento(s) disponibles.`,
    'success'
  );
};


/* =========================================================
   CABLE FORM VALIDATION
========================================================= */

const validateCableForm = (formData) => {
  const name = formData.get('name')?.trim();
  const category = formData.get('category')?.trim();
  const description = formData.get('description')?.trim();
  const purpose = formData.get('purpose')?.trim();

  return Boolean(
    name &&
    category &&
    description &&
    purpose
  );
};


/* =========================================================
   ADD ONE CABLE
========================================================= */

const handleCableSubmit = async (event) => {
  event.preventDefault();

  if (!cableForm) return;

  const formData = new FormData(cableForm);

  if (!validateCableForm(formData)) {
    setStatus(
      'Completa todos los campos requeridos.',
      'error'
    );

    return;
  }

  const cable = {
    name: formData.get('name').trim(),

    category: formData
      .get('category')
      .trim(),

    connector_type:
      formData
        .get('connector_type')
        ?.trim() || null,

    description:
      formData
        .get('description')
        .trim(),

    purpose:
      formData
        .get('purpose')
        .trim(),

    features:
      formData
        .get('features')
        ?.trim() || null,

    image_url:
      formData
        .get('image_url')
        ?.trim() || null
  };

  setStatus('Guardando elemento...', '');

  try {
    const { error } = await createCable(cable);

    if (error) {
      throw error;
    }

    cableForm.reset();

    await loadCatalog();
    await loadCategories();

    setStatus(
      `${cable.name} fue añadido correctamente.`,
      'success'
    );
  } catch (error) {
    console.error(error);

    setStatus(
      'No se pudo añadir el elemento. Verifica Supabase y los permisos RLS.',
      'error'
    );
  }
};


/* =========================================================
   BULK IMPORT FIELD NAMES
========================================================= */

const normalizeBulkField = (key) => {
  const normalized = key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (normalized === 'name') {
    return 'name';
  }

  if (
    normalized === 'category' ||
    normalized === 'categoria' ||
    normalized === 'categoría'
  ) {
    return 'category';
  }

  if (
    normalized === 'connector type' ||
    normalized === 'connector_type' ||
    normalized === 'connector'
  ) {
    return 'connector_type';
  }

  if (
    normalized === 'description' ||
    normalized === 'descripcion' ||
    normalized === 'descripción'
  ) {
    return 'description';
  }

  if (
    normalized === 'purpose' ||
    normalized === 'proposito' ||
    normalized === 'propósito'
  ) {
    return 'purpose';
  }

  if (
    normalized === 'features' ||
    normalized === 'characteristics' ||
    normalized === 'caracteristicas' ||
    normalized === 'características'
  ) {
    return 'features';
  }

  if (
    normalized === 'image url' ||
    normalized === 'image_url' ||
    normalized === 'image' ||
    normalized === 'imagen'
  ) {
    return 'image_url';
  }

  return null;
};


/* =========================================================
   PARSE BULK CABLES
========================================================= */

const parseBulkCables = (text) => {
  const blocks = text
    .split(/\r?\n\s*\*\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const cables = [];
  const errors = [];

  blocks.forEach((block, index) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const cable = {};

    lines.forEach((line) => {
      const [rawKey, ...rawValue] = line.split(':');

      if (!rawKey || rawValue.length === 0) {
        return;
      }

      const key = normalizeBulkField(rawKey);

      if (!key) {
        return;
      }

      cable[key] = rawValue
        .join(':')
        .trim();
    });

    if (!cable.name) {
      errors.push(
        `Entrada ${index + 1}: falta Name.`
      );
    }

    if (!cable.category) {
      errors.push(
        `Entrada ${index + 1}: falta Category.`
      );
    }

    if (!cable.description) {
      errors.push(
        `Entrada ${index + 1}: falta Description.`
      );
    }

    if (!cable.purpose) {
      errors.push(
        `Entrada ${index + 1}: falta Purpose.`
      );
    }

    cable.connector_type =
      cable.connector_type || null;

    cable.features =
      cable.features || null;

    cable.image_url =
      cable.image_url || null;

    cables.push(cable);
  });

  return {
    cables,
    errors
  };
};


/* =========================================================
   BULK INSERT
========================================================= */

const insertCablesBulk = async (cables) => {
  const { error } = await supabase
    .from('cables')
    .insert(cables);

  if (error) {
    throw error;
  }
};


/* =========================================================
   BULK IMPORT BUTTON
========================================================= */

const handleBulkImport = async () => {
  if (!bulkInput) return;

  const rawText = bulkInput.value.trim();

  if (!rawText) {
    setStatus(
      'Primero pega los cables en el cuadro de importación.',
      'error'
    );

    return;
  }

  const {
    cables,
    errors
  } = parseBulkCables(rawText);

  if (errors.length > 0) {
    setStatus(
      `Errores de importación: ${errors.join(' ')}`,
      'error'
    );

    return;
  }

  if (cables.length === 0) {
    setStatus(
      'No se encontraron elementos para importar.',
      'error'
    );

    return;
  }

  setStatus(
    `Importando ${cables.length} elemento(s)...`,
    ''
  );

  try {
    await insertCablesBulk(cables);

    bulkInput.value = '';

    await loadCatalog();
    await loadCategories();

    setStatus(
      `${cables.length} elemento(s) importados correctamente.`,
      'success'
    );
  } catch (error) {
    console.error(error);

    setStatus(
      'No se pudo completar la importación. Verifica la estructura de la tabla y los permisos de Supabase.',
      'error'
    );
  }
};


/* =========================================================
   REALTIME SUPABASE
========================================================= */

const subscribeToCatalog = () => {
  const channel = supabase
    .channel('public:cables')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cables'
      },
      async () => {
        await loadCatalog();
        await loadCategories();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(
          'Supabase Realtime conectado al catálogo.'
        );
      }
    });

  return channel;
};


/* =========================================================
   EVENT LISTENERS
========================================================= */

if (cableForm) {
  cableForm.addEventListener(
    'submit',
    handleCableSubmit
  );
}

if (bulkImportButton) {
  bulkImportButton.addEventListener(
    'click',
    handleBulkImport
  );
}

if (searchInput) {
  searchInput.addEventListener(
    'input',
    filterCatalog
  );
}

if (categoryFilter) {
  categoryFilter.addEventListener(
    'change',
    filterCatalog
  );
}


/* =========================================================
   START APPLICATION
========================================================= */

window.addEventListener(
  'DOMContentLoaded',
  async () => {
    await loadCategories();
    await loadCatalog();

    subscribeToCatalog();
  }
);
// =====================================================
// TABS
// =====================================================

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetTab = button.dataset.tab;

    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
    });

    tabContents.forEach((content) => {
      content.classList.remove('active');
    });

    button.classList.add('active');

    const targetContent = document.getElementById(targetTab);

    if (targetContent) {
      targetContent.classList.add('active');
    }
  });
});