/**
 * Cotizador - Lógica Principal
 * Maneja la interacción con la API de Catálogos y UI dinámica
 */

/**
 * Cotizador Dinámico - v2.1.0
 * Última actualización: 2024
 * Fixed: Null reference errors on displayResults
 */

class CotizadorApp {
  constructor(blockId, config) {
    this.blockId = blockId;
    this.config = config;
    this.API_URL = 'https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa';
    this.API_KEY = 'unQSy6sApK5bPnIZFiqMZ2NDGgTTzIb6PRpkZ7Y1';
    
    // Debug Mode - Cambiar a true para activar logs
    this.DEBUG_MODE = false;
    
    // State
    this.currentCategory = null;
    this.catalogPath = [];
    this.currentProduct = null;
    this.currentLoanData = null;
    this.selectedFrequency = null;
    this.selectedTerm = null;
    this.selectedPlan = 'tradicional';
    // Campos de sucursal y cita
    this.selectedBranchId = null;
    this.selectedAppointmentDate = null;
    this.selectedAppointmentTime = null;
    
    this.init();
  }

  // Método helper para logs de debug
  log(...args) {
    if (this.DEBUG_MODE) console.log(...args);
  }

  init() {
    // Aplanar estructura de categorías para que el Grid funcione correctamente en mobile
    const categoriesContainer = document.getElementById(`categories-${this.blockId}`);
    if (categoriesContainer) {
      const subDivs = Array.from(categoriesContainer.children).filter(child => child.tagName === 'DIV');
      if (subDivs.length > 0) {
        const fragment = document.createDocumentFragment();
        subDivs.forEach(div => {
          while (div.firstChild) {
            fragment.appendChild(div.firstChild);
          }
          div.remove();
        });
        categoriesContainer.appendChild(fragment);
      }
    }

    // Category buttons - buscar por .category-item que es la clase real en el HTML
    const categoryButtons = document.querySelectorAll(`#categories-${this.blockId} .category-item`);
    
    if (categoryButtons.length === 0) {
      console.warn('⚠️ No se encontraron botones de categoría. Intentando con selector alternativo...');
      // Fallback: intentar con cualquier botón dentro del contenedor
      const fallbackButtons = document.querySelectorAll(`#categories-${this.blockId} button[data-category]`);
      fallbackButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
        this.selectCategory(btn.getAttribute('data-category'), btn);
      });
    });
    } else {
      categoryButtons.forEach((btn) => {
        const category = btn.getAttribute('data-category');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectCategory(category, btn);
        });
      });
    }

    // Plan buttons
    document.getElementById(`btn-tradicional-${this.blockId}`).addEventListener('click', () => this.selectPlan('tradicional'));
    document.getElementById(`btn-fijo-${this.blockId}`).addEventListener('click', () => this.selectPlan('fijo'));

    // Continue button
    const btnContinue = document.getElementById(`btn-continue-${this.blockId}`);
    if (btnContinue) {
      btnContinue.addEventListener('click', () => this.showContactForm());
    }

    // Simulate another button - se configura dinámicamente en displayResults
    const btnSimulate = document.getElementById(`btn-simulate-${this.blockId}`);
    if (btnSimulate) {
      btnSimulate.addEventListener('click', () => this.resetSimulation());
    }

    // Modal - link-details ya no se usa, comentado
    // const linkDetails = document.getElementById(`link-details-${this.blockId}`);
    // if (linkDetails) {
    //   linkDetails.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     this.showPaymentDetails();
    //   });
    // }
    
    const modalClose = document.getElementById(`modal-close-${this.blockId}`);
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }
    
    const modal = document.getElementById(`modal-${this.blockId}`);
    if (modal) {
      modal.addEventListener('click', (e) => {
      if (e.target.id === `modal-${this.blockId}`) this.closeModal();
    });
    }

    // Form
    const form = document.getElementById(`cotizador-form-${this.blockId}`);
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Reset button (Success Panel)
    const resetBtn = document.getElementById(`btn-reset-${this.blockId}`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAll());
    }

    // Reset catalog button (Details Panel) - ahora es un link
    const resetCatalogBtn = document.getElementById(`btn-reset-catalog-${this.blockId}`);
    if (resetCatalogBtn) {
      resetCatalogBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetCatalog();
      });
    }
  }

  resetCatalog() {
    this.catalogPath = [];
    this.currentCategory = null;
    this.updateDetailsPanel();
    
    // Mostrar título y descripción nuevamente
    const header = document.querySelector(`#cotizador-${this.blockId} .cotizador-header`);
    if (header) {
      header.style.display = 'flex';
    }
    
    // Limpiar dropdowns y grid
    const dropdownsContainer = document.getElementById(`catalog-dropdowns-${this.blockId}`);
    const itemsDiv = document.getElementById(`catalog-items-${this.blockId}`);
    
    if (dropdownsContainer) dropdownsContainer.innerHTML = '';
    if (itemsDiv) itemsDiv.innerHTML = '';
    
    document.getElementById(`catalog-nav-${this.blockId}`).style.display = 'none';
    document.getElementById(`categories-${this.blockId}`).style.display = 'grid';
    document.querySelectorAll(`#categories-${this.blockId} .category-item`).forEach(btn => btn.classList.remove('active'));
  }

  selectCategory(category, button) {
    this.currentCategory = category;
    this.catalogPath = [];
    
    // Remover active de todos los botones
    document.querySelectorAll(`#categories-${this.blockId} .category-item`).forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Agregar active al botón seleccionado
    if (button) {
    button.classList.add('active');
    }
    
    // Ocultar título y descripción cuando se muestra la segunda pantalla
    const header = document.querySelector(`#cotizador-${this.blockId} .cotizador-header`);
    if (header) {
      header.style.display = 'none';
    }
    
    // Mostrar navegación de catálogo y ocultar categorías
    const catalogNav = document.getElementById(`catalog-nav-${this.blockId}`);
    const mainPanels = document.getElementById(`main-panels-${this.blockId}`);
    const categoriesDiv = document.getElementById(`categories-${this.blockId}`);
    const transitionLoader = document.getElementById(`screen-transition-loader-${this.blockId}`);
    
    if (catalogNav) {
      catalogNav.style.setProperty('display', 'block', 'important');
      catalogNav.style.setProperty('visibility', 'visible', 'important');
    } else {
      console.error('❌ No se encontró catalog-nav');
    }
    
    if (mainPanels) mainPanels.style.setProperty('display', 'none', 'important');
    if (categoriesDiv) categoriesDiv.style.setProperty('display', 'none', 'important');
    
    // No hacer scroll automático - mantener posición actual
    
    // Actualizar panel de detalles con la categoría seleccionada
    this.updateDetailsPanel();
    
    // Mapeo de categorías a catalog IDs
    const catalogIds = {
      'metals': 'metal_gold_catalog',
      'watches': 'metal_gold_catalog', // Los relojes usan el mismo catálogo que metales
      'diamonds': 'diamond_color_catalog',
      'electronics': 'subcategory_miscellaneous',
      'celulares': 'subcategory_miscellaneous',
      'laptops': 'subcategory_miscellaneous',
      'tablets': 'subcategory_miscellaneous',
      'smartwatch': 'subcategory_miscellaneous',
      'consoles': 'subcategory_miscellaneous',
      'others': 'subcategory_miscellaneous',
      'auto': 'subcategory_vehicles',
      'moto': 'subcategory_vehicles',
      'vehicles': 'subcategory_vehicles',
      'auto_financing': 'subcategory_vehicles'
    };
    
    const catalogId = catalogIds[category];
    
    if (!catalogId) {
      console.error('❌ No se encontró catalogId para la categoría:', category);
      alert(`Categoría "${category}" no está configurada. Por favor contacta al administrador.`);
      return;
    }
    
    // Guardar la categoría seleccionada para filtrar después (vehículos)
    this.selectedVehicleCategory = category;
    
    this.loadCatalog(catalogId, {});
  }

  async loadCatalog(catalogId, params) {
    const loadingDiv = document.getElementById(`loading-${this.blockId}`);
    const itemsDiv = document.getElementById(`catalog-items-${this.blockId}`);
    const dropdownsContainer = document.getElementById(`catalog-dropdowns-${this.blockId}`);
    
    if (!loadingDiv) {
      console.error('❌ No se encontró loadingDiv');
      return;
    }
    
    // Ocultar dropdowns COMPLETAMENTE antes de mostrar loader
    if (dropdownsContainer) {
      // Guardar la altura del wrapper del dropdown si existe
      const dropdownWrapper = dropdownsContainer.querySelector('.catalog-dropdown-wrapper');
      let savedHeight = '150px'; // Altura por defecto
      
      if (dropdownWrapper && dropdownWrapper.offsetHeight > 0) {
        savedHeight = dropdownWrapper.offsetHeight + 'px';
      } else if (dropdownsContainer.offsetHeight > 0) {
        savedHeight = dropdownsContainer.offsetHeight + 'px';
      }
      
      // Ocultar COMPLETAMENTE el contenedor de dropdowns
      dropdownsContainer.style.display = 'none';
      dropdownsContainer.style.visibility = 'hidden';
      dropdownsContainer.style.opacity = '0';
      
      // Configurar el loader para ocupar EXACTAMENTE el mismo espacio
      loadingDiv.style.minHeight = savedHeight;
    } else {
      // Si no hay contenedor, usar altura por defecto
      loadingDiv.style.minHeight = '150px';
    }
    
    if (itemsDiv) {
      itemsDiv.style.display = 'none';
      itemsDiv.style.visibility = 'hidden';
    }
    
    // Mostrar loader centrado - FORZAR con !important
    loadingDiv.style.setProperty('display', 'flex', 'important');
    loadingDiv.style.setProperty('flex-direction', 'column', 'important');
    loadingDiv.style.setProperty('align-items', 'center', 'important');
    loadingDiv.style.setProperty('justify-content', 'center', 'important');
    loadingDiv.style.setProperty('visibility', 'visible', 'important');
    loadingDiv.style.setProperty('opacity', '1', 'important');
    loadingDiv.style.setProperty('z-index', '100', 'important');
    loadingDiv.style.setProperty('background', 'transparent', 'important');
    
    // Ocultar skeleton si existe
    const skeletonLoader = loadingDiv.querySelector('.skeleton-loader');
    if (skeletonLoader) {
      skeletonLoader.style.setProperty('display', 'none', 'important');
    }
    
    // Mostrar solo el spinner
    const spinnerLoader = loadingDiv.querySelector('.spinner-loader');
    if (spinnerLoader) {
      spinnerLoader.style.setProperty('display', 'flex', 'important');
      spinnerLoader.style.setProperty('visibility', 'visible', 'important');
      spinnerLoader.style.setProperty('opacity', '1', 'important');
      
      // Asegurar que el spinner interno esté visible
      const spinner = spinnerLoader.querySelector('.spinner');
      if (spinner) {
        spinner.style.setProperty('display', 'block', 'important');
        spinner.style.setProperty('visibility', 'visible', 'important');
        spinner.style.setProperty('opacity', '1', 'important');
        spinner.style.setProperty('width', '56px', 'important');
        spinner.style.setProperty('height', '56px', 'important');
        spinner.style.setProperty('min-width', '56px', 'important');
        spinner.style.setProperty('min-height', '56px', 'important');
        spinner.style.setProperty('border-width', '4px', 'important');
      }
    }
    
    // Verificar el contenedor padre
    const parentPanel = loadingDiv.closest('.catalog-navigation-panel');
    if (parentPanel && getComputedStyle(parentPanel).display === 'none') {
      parentPanel.style.setProperty('display', 'flex', 'important');
      parentPanel.style.setProperty('visibility', 'visible', 'important');
    }
    
    // Forzar reflow para asegurar renderizado
    loadingDiv.offsetHeight;
    
    try {
      // Detectar si es catálogo de vehículos (catalog-ext) o estándar (catalog)
      const isVehicleCatalog = catalogId === 'subcategory_vehicles' || 
                               catalogId === 'year_vehicles' || 
                               catalogId === 'brand_vehicles' || 
                               catalogId === 'model_vehicles' || 
                               catalogId === 'version_vehicles';
      const endpoint = isVehicleCatalog ? '/simulator/catalog-ext' : '/simulator/catalog';
      
      // Construir request body según el tipo de catálogo
      let dataParams;
      
      if (isVehicleCatalog) {
        if (catalogId === 'subcategory_vehicles') {
          // Para el primer catálogo de vehículos, solo user_id y prospect_flag
          dataParams = {
            user_id: params.user_id || '',
            prospect_flag: params.prospect_flag ?? false
          };
        } else {
          // Para los demás catálogos de vehículos, incluir todos los parámetros
          dataParams = {
            user_id: params.user_id || '',
            prospect_flag: params.prospect_flag ?? false,
            vehicle: params.vehicle || params.vehicle_type || '',
            brand: params.brand || '',
            model: params.model || '',
            year: params.year || '',
            vehicle_type: params.vehicle_type || ''
          };
        }
      } else {
        dataParams = { user_id: '', prospect_flag: false, ...params };
      }
      
      const requestBody = {
        catalog_id: catalogId,
        data: dataParams
      };
      
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`API error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      // Ocultar loader de transición
      const transitionLoader = document.getElementById(`screen-transition-loader-${this.blockId}`);
      if (transitionLoader) {
        transitionLoader.style.display = 'none';
      }
      
      if (!result.catalog || !result.catalog.data || result.catalog.data.length === 0) {
        loadingDiv.style.setProperty('display', 'none', 'important');
        this.calculateAndShowResults();
        return;
      }
      
      // Manejo especial para vehículos: filtrar o auto-seleccionar según la categoría
      if (catalogId === 'subcategory_vehicles' && result.catalog && result.catalog.data) {
        if (this.selectedVehicleCategory === 'moto') {
          // Auto-seleccionar "Motos" y continuar directamente
          const motoItem = result.catalog.data.find(item => 
            item.name.toLowerCase().includes('moto')
          );
          
          if (motoItem) {
            this.log(`🛵 Auto-seleccionando Moto: ${motoItem.name}`);
            loadingDiv.style.setProperty('display', 'none', 'important');
            this.selectCatalogItem(motoItem, result.catalog.catalog_id);
            return;
          }
        } else if (this.selectedVehicleCategory === 'auto') {
          // Filtrar solo opciones que contengan "Auto" (excluyendo "Motos")
          result.catalog.data = result.catalog.data.filter(item => 
            !item.name.toLowerCase().includes('moto')
          );
        }
      }
      
      // Auto-selección para saltar redundancia (ej: Consolas -> Consolas -> Marca)
      // Solo aplicar si estamos en el primer nivel (catalogPath vacío)
      this.log(`🔍 Revisando auto-selección. Categoría: ${this.currentCategory}, Path: ${this.catalogPath.length}`);
      
      if (this.catalogPath.length === 0 && this.currentCategory) {
        const categoryMap = {
          'consoles': ['Consola de Videojuego', 'Consolas', 'Videojuegos'],
          'celulares': ['Celular', 'Celulares', 'Telefonia', 'Telefonía'],
          'laptops': ['Laptop', 'Laptops', 'Computadoras', 'Portátiles'],
          'tablets': ['Tableta', 'Tabletas', 'Tablets', 'iPad'],
          'smartwatch': ['Smartwatch', 'Relojes Inteligentes', 'Wearables']
          // No aplicamos a 'electronics' porque ese sí requiere elegir subcategoría
        };

        const targetKeywords = categoryMap[this.currentCategory];
        
        if (targetKeywords && targetKeywords.length > 0 && result.catalog && result.catalog.data) {
          this.log(`🔍 Buscando keywords: ${targetKeywords.join(', ')} en datos:`, result.catalog.data.map(i => i.name));
          
          const autoItem = result.catalog.data.find(item => 
            targetKeywords.some(keyword => item.name.toLowerCase().includes(keyword.toLowerCase()))
          );

          if (autoItem) {
            this.log(`🔄 Auto-seleccionando categoría redundante: ${autoItem.name}`);
            
            // Ocultar loader PRIMERO para evitar parpadeos
            loadingDiv.style.setProperty('display', 'none', 'important');
            
            // Simular selección automática y salir
            this.selectCatalogItem(autoItem, result.catalog.catalog_id);
            return; 
          } else {
            this.log(`⚠️ No se encontró coincidencia para auto-selección.`);
          }
        }
      }
      
      // Ocultar loader PRIMERO
      loadingDiv.style.setProperty('display', 'none', 'important');
      loadingDiv.style.minHeight = ''; // Limpiar altura mínima
      
      // Llamar a displayCatalog que mostrará el nuevo dropdown (sin delay innecesario)
      this.displayCatalog(result.catalog);
      this.updateBreadcrumb();
      this.updateDetailsPanel();
      
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Ocultar loaders y mostrar error
      const transitionLoader = document.getElementById(`screen-transition-loader-${this.blockId}`);
      if (transitionLoader) {
        transitionLoader.style.setProperty('display', 'none', 'important');
      }
      loadingDiv.style.setProperty('display', 'none', 'important');
      
      // Mostrar error en el contenedor de dropdowns si existe
      if (dropdownsContainer) {
        dropdownsContainer.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 2rem;">Error cargando catálogo<br><small>${error.message}</small></p>`;
        dropdownsContainer.style.display = 'flex';
      } else if (itemsDiv) {
        itemsDiv.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 2rem;">Error cargando catálogo<br><small>${error.message}</small></p>`;
        itemsDiv.style.display = 'block';
      }
    } finally {
      // NO ocultar el loader aquí automáticamente - ya se oculta en los casos de éxito/error
      // Solo limpiar altura mínima si es necesario
      // El loader se oculta explícitamente en los casos de éxito o error arriba
    }
  }

  displayCatalog(catalog) {
    try {
      if (!catalog) {
        console.error('❌ Catalog es null o undefined');
        return;
      }
      
      const dropdownsContainer = document.getElementById(`catalog-dropdowns-${this.blockId}`);
    const itemsDiv = document.getElementById(`catalog-items-${this.blockId}`);
      const helpText = document.getElementById(`dropdown-help-${this.blockId}`);
      
      if (!dropdownsContainer) {
        console.error('❌ No se encontró el contenedor de dropdowns');
        return;
      }
      
      // Ocultar grid y loader COMPLETAMENTE antes de mostrar dropdown
      if (itemsDiv) {
        itemsDiv.style.display = 'none';
        itemsDiv.style.visibility = 'hidden';
      }
      
      const loadingDiv = document.getElementById(`loading-${this.blockId}`);
      let savedLoaderHeight = '';
      if (loadingDiv) {
        // Guardar la altura del loader antes de ocultarlo
        savedLoaderHeight = loadingDiv.style.minHeight || '';
        // Ocultar COMPLETAMENTE el loader
        loadingDiv.style.display = 'none';
        loadingDiv.style.visibility = 'hidden';
        loadingDiv.style.opacity = '0';
        loadingDiv.style.minHeight = ''; // Limpiar altura mínima
      }
      
      // Ocultar TODOS los dropdowns anteriores antes de mostrar el nuevo
      const existingDropdowns = dropdownsContainer.querySelectorAll('.catalog-dropdown-wrapper');
      existingDropdowns.forEach(wrapper => {
        wrapper.style.display = 'none';
        wrapper.style.visibility = 'hidden';
        wrapper.style.opacity = '0';
      });
      
      // Mostrar contenedor de dropdowns en la MISMA posición
      dropdownsContainer.style.display = 'flex';
      dropdownsContainer.style.flexDirection = 'column';
      dropdownsContainer.style.width = '100%';
      dropdownsContainer.style.maxWidth = '620px';
      dropdownsContainer.style.alignItems = 'flex-start';
      dropdownsContainer.style.visibility = 'visible';
      dropdownsContainer.style.opacity = '1';
      dropdownsContainer.style.margin = '0 auto';
      dropdownsContainer.style.position = 'relative';
      dropdownsContainer.style.zIndex = '5';
      
      // Mantener la misma altura mínima que tenía el loader si existe
      if (savedLoaderHeight) {
        dropdownsContainer.style.minHeight = savedLoaderHeight;
      }
      
      // Verificar datos del catálogo
      if (!catalog.data || catalog.data.length === 0) {
        console.warn('⚠️ Catálogo vacío o sin datos');
        dropdownsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No hay opciones disponibles</p>';
        return;
      }
      
      // Mostrar texto de ayuda para ciertos catálogos
      if (helpText) {
        const showHelpCatalogs = ['brand_catalog', 'model_catalog'];
        if (catalog.catalog_id && showHelpCatalogs.includes(catalog.catalog_id)) {
          helpText.style.display = 'block';
        } else {
          helpText.style.display = 'none';
        }
      }
      
      // Determinar si es un catálogo de marcas, modelos o características para mostrar diseño especial
      const isBrandCatalog = ['brand_catalog', 'brand_vehicles'].includes(catalog.catalog_id);
      const isModelCatalog = ['model_catalog', 'model_vehicles'].includes(catalog.catalog_id);
      const isFeatureCatalog = ['feature_1_catalog', 'feature_2_catalog', 'feature_3_catalog'].includes(catalog.catalog_id);
      const isMetalCatalog = ['metal_gold_catalog', 'metal_silver_catalog'].includes(catalog.catalog_id);
      const isVehicleTypeCatalog = catalog.catalog_id === 'subcategory_vehicles';
      const isYearCatalog = catalog.catalog_id === 'year_vehicles';
      const isSubcategoryCatalog = catalog.catalog_id === 'subcategory_miscellaneous';
      
      if (isBrandCatalog) {
        this.renderBrandSelection(catalog, dropdownsContainer);
      } else if (isModelCatalog) {
        this.renderModelSelection(catalog, dropdownsContainer);
      } else if (isFeatureCatalog) {
        this.renderFeatureSelection(catalog, dropdownsContainer);
      } else if (isMetalCatalog) {
        this.renderMetalCalculator(catalog, dropdownsContainer);
      } else if (isVehicleTypeCatalog) {
        this.renderVehicleTypeSelection(catalog, dropdownsContainer);
      } else if (isYearCatalog) {
        this.renderYearSelection(catalog, dropdownsContainer);
      } else if (isSubcategoryCatalog) {
        this.renderSubcategorySelection(catalog, dropdownsContainer);
      } else {
        this.renderStandardDropdown(catalog, dropdownsContainer);
      }
      
      // Asegurar visibilidad final con múltiples métodos
      dropdownsContainer.style.display = 'flex';
      dropdownsContainer.style.flexDirection = 'column';
      dropdownsContainer.style.visibility = 'visible';
      dropdownsContainer.style.opacity = '1';
      dropdownsContainer.style.width = '100%';
      dropdownsContainer.style.maxWidth = '620px';
      dropdownsContainer.style.alignItems = 'flex-start';
      dropdownsContainer.setAttribute('style', 
        'display: flex !important; ' +
        'flex-direction: column !important; ' +
        'visibility: visible !important; ' +
        'opacity: 1 !important; ' +
        'width: 100% !important; ' +
        'max-width: 620px !important; ' +
        'align-items: flex-start !important;'
      );
      
      // Forzar reflow para asegurar que el navegador renderice
      dropdownsContainer.offsetHeight;
      
      // Verificar que el padre también esté visible
      const parentPanel = dropdownsContainer.closest('.catalog-navigation-panel');
      if (parentPanel) {
        parentPanel.style.display = 'flex';
        parentPanel.style.visibility = 'visible';
      }
      
    } catch (error) {
      console.error('❌ Error en displayCatalog:', error);
      // Intentar mostrar error en UI
      const container = document.getElementById(`catalog-dropdowns-${this.blockId}`);
      if (container) {
        container.innerHTML = `<p style="color: red">Error visualizando opciones: ${error.message}</p>`;
        container.style.display = 'block';
      }
    }
  }

  createTradeInHeader() {
    const header = document.createElement('div');
    header.className = 'tradein-header';
    
    // Botón de volver
    const backBtn = document.createElement('button');
    backBtn.className = 'tradein-back-btn';
    backBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
    `;
    backBtn.onclick = (e) => {
      e.preventDefault();
      this.goBackOneStep();
    };
    header.appendChild(backBtn);
    
    // Título "COTIZADOR"
    const tradeinTitle = document.createElement('div');
    tradeinTitle.className = 'tradein-title';
    tradeinTitle.textContent = 'COTIZADOR';
    header.appendChild(tradeinTitle);
    
    /* Stepper temporalmente comentado para evitar traslape
    const stepper = document.createElement('div');
    stepper.className = 'tradein-stepper';
    
    const totalSteps = 7; // Ajustar según el flujo
    const currentStep = this.catalogPath.length;
    
    for (let i = 0; i < totalSteps; i++) {
      const dot = document.createElement('div');
      dot.className = i <= currentStep ? 'tradein-step active' : 'tradein-step';
      stepper.appendChild(dot);
    }
    
    header.appendChild(stepper);
    */
    
    return header;
  }

  createMobileStepper() {
    const stepper = document.createElement('div');
    stepper.className = 'mobile-stepper';
    stepper.dataset.catalogStepper = 'true';
    
    const totalSteps = 7;
    const currentStep = this.catalogPath.length;
    
    for (let i = 0; i < totalSteps; i++) {
      const step = document.createElement('div');
      step.className = 'mobile-stepper-step';
      if (i < currentStep) {
        step.classList.add('active');
      }
      stepper.appendChild(step);
    }
    
    return stepper;
  }

  updateMobileStepper() {
    const steppers = document.querySelectorAll('.mobile-stepper[data-catalog-stepper="true"]');
    if (steppers.length === 0) return;
    
    const currentStep = this.catalogPath.length;
    
    steppers.forEach(stepper => {
      const steps = stepper.querySelectorAll('.mobile-stepper-step');
      steps.forEach((step, index) => {
        if (index < currentStep) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });
    });
  }

  goBackOneStep() {
    if (this.catalogPath.length === 0) {
      // Si no hay pasos, volver a categorías
      this.resetCatalog();
      return;
    }
    
    // Retroceder un paso
    this.catalogPath.pop();
    
    if (this.catalogPath.length === 0) {
      // Si después de retroceder no quedan pasos, volver a categorías
      this.resetCatalog();
    } else {
      // Recargar el catálogo del paso anterior
      const lastItem = this.catalogPath[this.catalogPath.length - 1];
      const nextCatalog = this.getNextCatalog(lastItem.catalogId, lastItem);
      
      if (nextCatalog) {
        this.loadCatalog(nextCatalog.catalogId, nextCatalog.params);
      } else {
        this.resetCatalog();
      }
    }
  }

  renderStandardDropdown(catalog, container) {
      // Determinar el label del dropdown basado en el catalogId
      const dropdownLabel = this.getDropdownLabel(catalog.catalog_id);
      
      // Crear nuevo dropdown (siempre crear uno nuevo, los anteriores ya están ocultos)
      const dropdownWrapper = document.createElement('div');
      dropdownWrapper.className = 'catalog-dropdown-wrapper';
      dropdownWrapper.style.width = '100%';
      dropdownWrapper.style.display = 'flex';
      dropdownWrapper.style.flexDirection = 'column';
      dropdownWrapper.style.visibility = 'visible';
      dropdownWrapper.style.opacity = '1';
      
      const labelElement = document.createElement('label');
      labelElement.className = 'dropdown-label';
      labelElement.textContent = dropdownLabel;
      dropdownWrapper.appendChild(labelElement);
      
      const dropdown = document.createElement('select');
      dropdown.className = 'catalog-dropdown';
      dropdown.id = `dropdown-${catalog.catalog_id}-${this.blockId}`;
      dropdown.disabled = false;
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = this.getDropdownPlaceholder(catalog.catalog_id);
      dropdown.appendChild(defaultOption);
      
      catalog.data.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = item.name + (item.description ? ` - ${item.description}` : '');
        option.dataset.item = JSON.stringify(item);
        dropdown.appendChild(option);
      });
      
      dropdownWrapper.appendChild(dropdown);
      container.appendChild(dropdownWrapper);
      
      this.attachDropdownListener(dropdown, catalog.data, catalog.catalog_id);
  }

  renderSubcategorySelection(catalog, container) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear estructura principal
    const wrapper = document.createElement('div');
    wrapper.className = 'brand-selection-wrapper';
    
    // Header con botón de volver
    const header = this.createTradeInHeader();
    wrapper.appendChild(header);
    
    // Stepper móvil
    const mobileStepper = this.createMobileStepper();
    wrapper.appendChild(mobileStepper);
    
    // Título
    const title = document.createElement('h3');
    title.className = 'brand-selection-title';
    title.textContent = '¿Qué tipo de artículo es?';
    wrapper.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'brand-selection-subtitle';
    subtitle.textContent = 'Selecciona la categoría de tu electrónico.';
    wrapper.appendChild(subtitle);
    
    // Barra de búsqueda
    const searchContainer = document.createElement('div');
    searchContainer.className = 'brand-search-container';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'brand-search-input';
    searchInput.placeholder = 'Buscar categoría...';
    searchContainer.appendChild(searchInput);
    wrapper.appendChild(searchContainer);
    
    // Lista de subcategorías
    const subcategoriesList = document.createElement('div');
    subcategoriesList.className = 'other-brands-list';
    
    const renderList = (items) => {
      subcategoriesList.innerHTML = '';
      if (items.length === 0) {
        subcategoriesList.innerHTML = '<div class="no-results">No se encontraron opciones</div>';
        return;
      }
      
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'brand-list-item model-list-item';
        row.innerHTML = `
          <div class="model-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>${item.name}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        `;
        row.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectCatalogItem(item, catalog.catalog_id);
        });
        subcategoriesList.appendChild(row);
      });
    };
    
    // Renderizar lista inicial
    renderList(catalog.data);
    
    wrapper.appendChild(subcategoriesList);
    container.appendChild(wrapper);
    
    // Lógica de búsqueda
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      
      if (term === '') {
        renderList(catalog.data);
      } else {
        const filtered = catalog.data.filter(item => item.name.toLowerCase().includes(term));
        renderList(filtered);
      }
    });
  }

  renderBrandSelection(catalog, container) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear estructura principal
    const wrapper = document.createElement('div');
    wrapper.className = 'brand-selection-wrapper';
    
    // Header con botón de volver
    const header = this.createTradeInHeader();
    wrapper.appendChild(header);
    
    // Stepper móvil
    const mobileStepper = this.createMobileStepper();
    wrapper.appendChild(mobileStepper);
    
    // Título
    const title = document.createElement('h3');
    title.className = 'brand-selection-title';
    title.textContent = '¿Qué marca es?';
    wrapper.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'brand-selection-subtitle';
    subtitle.textContent = 'Selecciona la marca de tu dispositivo.';
    wrapper.appendChild(subtitle);
    
    // Barra de búsqueda
    const searchContainer = document.createElement('div');
    searchContainer.className = 'brand-search-container';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'brand-search-input';
    searchInput.placeholder = 'Buscar marca...';
    // Icono de lupa (opcional, con CSS)
    searchContainer.appendChild(searchInput);
    wrapper.appendChild(searchContainer);
    
    // Definir marcas populares y sus estilos
    const popularBrands = [
      { name: 'APPLE', color: '#111827', text: 'white' },
      { name: 'SAMSUNG', color: '#3b82f6', text: 'white' },
      { name: 'XIAOMI', color: '#f97316', text: 'white' },
      { name: 'MOTOROLA', color: '#6366f1', text: 'white' }
    ];
    
    // Separar datos
    const popularItems = [];
    const otherItems = [];
    
    catalog.data.forEach((item, index) => {
      const brandName = item.name.toUpperCase();
      const popularConfig = popularBrands.find(b => brandName.includes(b.name));
      
      if (popularConfig) {
        popularItems.push({ item, index, config: popularConfig });
      } else {
        otherItems.push({ item, index });
      }
    });
    
    // Grid de marcas populares
    if (popularItems.length > 0) {
      const popularGrid = document.createElement('div');
      popularGrid.className = 'popular-brands-grid';
      
      popularItems.forEach(({ item, index, config }) => {
        const btn = document.createElement('button');
        btn.className = 'brand-card-btn';
        btn.style.backgroundColor = config.color;
        btn.style.color = config.text;
        btn.innerHTML = `
          <span class="brand-name">${item.name}</span>
          <div class="brand-card-decoration"></div>
        `;
        btn.onclick = (e) => {
          e.preventDefault();
          this.log('👉 Click en marca popular:', item.name);
          this.selectCatalogItem(item, catalog.catalog_id);
        };
        popularGrid.appendChild(btn);
      });
      
      wrapper.appendChild(popularGrid);
    }
    
    // Lista de otras marcas
    const othersList = document.createElement('div');
    othersList.className = 'other-brands-list';
    
    const renderList = (items) => {
      othersList.innerHTML = '';
      if (items.length === 0) {
        othersList.innerHTML = '<div class="no-results">No se encontraron marcas</div>';
        return;
      }
      
      items.forEach(({ item, index }) => {
        const row = document.createElement('div');
        row.className = 'brand-list-item';
        row.innerHTML = `
          <span>${item.name}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        `;
        row.onclick = (e) => {
          e.preventDefault();
          this.log('👉 Click en otra marca:', item.name);
          this.selectCatalogItem(item, catalog.catalog_id);
        };
        othersList.appendChild(row);
      });
    };
    
    renderList(otherItems);
    wrapper.appendChild(othersList);
    container.appendChild(wrapper);
    
    // Lógica de búsqueda
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const allItems = [...popularItems, ...otherItems];
      
      if (term === '') {
        // Restaurar vista original
        if (wrapper.contains(document.querySelector('.popular-brands-grid'))) {
           document.querySelector('.popular-brands-grid').style.display = 'grid';
        }
        renderList(otherItems);
      } else {
        // Ocultar populares y filtrar lista completa
        const popularGrid = document.querySelector('.popular-brands-grid');
        if (popularGrid) popularGrid.style.display = 'none';
        
        const filtered = allItems.filter(({ item }) => item.name.toLowerCase().includes(term));
        renderList(filtered);
      }
    });
  }

  renderModelSelection(catalog, container) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Obtener la marca seleccionada del catalogPath
    const brandItem = this.catalogPath.find(p => p.catalogId === 'brand_catalog' || p.catalogId === 'brand_vehicles');
    const brandName = brandItem ? brandItem.name : 'la marca';
    
    // Crear estructura principal
    const wrapper = document.createElement('div');
    wrapper.className = 'brand-selection-wrapper'; // Reutilizamos los mismos estilos
    
    // Header con botón de volver
    const header = this.createTradeInHeader();
    wrapper.appendChild(header);
    
    // Stepper móvil
    const mobileStepper = this.createMobileStepper();
    wrapper.appendChild(mobileStepper);
    
    // Título
    const title = document.createElement('h3');
    title.className = 'brand-selection-title';
    title.textContent = '¿Qué modelo es?';
    wrapper.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'brand-selection-subtitle';
    subtitle.innerHTML = `Marca: <strong>${brandName}</strong>`;
    wrapper.appendChild(subtitle);
    
    // Barra de búsqueda
    const searchContainer = document.createElement('div');
    searchContainer.className = 'brand-search-container';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'brand-search-input';
    searchInput.placeholder = `Buscar modelo ${brandName}...`;
    searchContainer.appendChild(searchInput);
    wrapper.appendChild(searchContainer);
    
    // Lista de modelos (todos en lista, sin destacados)
    const modelsList = document.createElement('div');
    modelsList.className = 'other-brands-list'; // Reutilizamos estilos
    
    const renderList = (items) => {
      modelsList.innerHTML = '';
      if (items.length === 0) {
        modelsList.innerHTML = '<div class="no-results">No se encontraron modelos</div>';
        return;
      }
      
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'brand-list-item model-list-item';
        row.innerHTML = `
          <div class="model-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>${item.name}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        `;
        row.onclick = (e) => {
          e.preventDefault();
          this.log('👉 Click en modelo:', item.name);
          this.selectCatalogItem(item, catalog.catalog_id);
        };
        modelsList.appendChild(row);
      });
    };
    
    // Función para ordenar modelos del más nuevo al más viejo
    const sortModelsByYear = (items) => {
      return items.slice().sort((a, b) => {
        // Extraer años del nombre (busca números de 4 dígitos que parezcan años)
        const yearRegex = /\((\d{4})\)|\b(20\d{2})\b/g;
        const yearsA = a.name.match(yearRegex);
        const yearsB = b.name.match(yearRegex);
        
        // Si ambos tienen año, ordenar por año descendente
        if (yearsA && yearsB) {
          const yearA = parseInt(yearsA[yearsA.length - 1].replace(/[()]/g, ''));
          const yearB = parseInt(yearsB[yearsB.length - 1].replace(/[()]/g, ''));
          return yearB - yearA; // Más nuevo primero
        }
        
        // Si solo uno tiene año, ese va primero
        if (yearsA) return -1;
        if (yearsB) return 1;
        
        // Si ninguno tiene año, mantener orden original
        return 0;
      });
    };
    
    // Renderizar lista inicial (ordenada del más nuevo al más viejo)
    const sortedData = sortModelsByYear(catalog.data);
    renderList(sortedData);
    
    wrapper.appendChild(modelsList);
    container.appendChild(wrapper);
    
    // Lógica de búsqueda
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      
      if (term === '') {
        renderList(sortedData);
      } else {
        const filtered = sortedData.filter(item => item.name.toLowerCase().includes(term));
        renderList(filtered);
      }
    });
  }

  renderFeatureSelection(catalog, container) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Obtener información del producto seleccionado
    const brandItem = this.catalogPath.find(p => p.catalogId === 'brand_catalog' || p.catalogId === 'brand_vehicles');
    const modelItem = this.catalogPath.find(p => p.catalogId === 'model_catalog' || p.catalogId === 'model_vehicles');
    
    const brandName = brandItem ? brandItem.name : '';
    const modelName = modelItem ? modelItem.name : '';
    
    // Determinar el paso actual
    const currentStep = this.catalogPath.length;
    const totalSteps = 7; // Ajustar según tu flujo
    
    // Determinar el título de la característica
    const featureTitles = {
      'feature_1_catalog': 'Almacenamiento',
      'feature_2_catalog': 'Memoria RAM',
      'feature_3_catalog': 'Estado'
    };
    const featureTitle = featureTitles[catalog.catalog_id] || 'Selecciona una opción';
    
    // Iconos para cada tipo de característica
    const featureIcons = {
      'feature_1_catalog': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="15" x2="15" y2="15"/>',
      'feature_2_catalog': '<rect x="2" y="7" width="20" height="10" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/>',
      'feature_3_catalog': '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>'
    };
    const featureIcon = featureIcons[catalog.catalog_id] || '<circle cx="12" cy="12" r="10"/>';
    
    // Crear estructura principal
    const wrapper = document.createElement('div');
    wrapper.className = 'feature-selection-wrapper';
    
    // Header con botón de volver
    const header = this.createTradeInHeader();
    wrapper.appendChild(header);
    
    // Stepper móvil
    const mobileStepper = this.createMobileStepper();
    wrapper.appendChild(mobileStepper);
    
    // Título
    const title = document.createElement('h3');
    title.className = 'brand-selection-title';
    title.textContent = featureTitle;
    wrapper.appendChild(title);
    
    // Subtítulo con paso
    const subtitle = document.createElement('p');
    subtitle.className = 'brand-selection-subtitle feature-step';
    subtitle.textContent = `Característica ${catalog.catalog_id.includes('1') ? '1' : catalog.catalog_id.includes('2') ? '2' : '3'}`;
    wrapper.appendChild(subtitle);
    
    // Badge del producto seleccionado
    if (brandName && modelName) {
      const productBadge = document.createElement('div');
      productBadge.className = 'product-badge';
      productBadge.innerHTML = `
        <div class="product-badge-icon-simple">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </div>
        <span class="product-badge-text">${brandName} ${modelName}</span>
      `;
      wrapper.appendChild(productBadge);
      
      // Mostrar característica previa seleccionada (feature_1 si estamos en feature_2)
      if (catalog.catalog_id === 'feature_2_catalog') {
        const feature1 = this.catalogPath.find(p => p.catalogId === 'feature_1_catalog');
        if (feature1) {
          const prevBadge = document.createElement('div');
          prevBadge.className = 'selected-feature-badge';
          prevBadge.innerHTML = `
            <div class="feature-check-icon"></div>
            <span>${feature1.name} Seleccionado</span>
          `;
          wrapper.appendChild(prevBadge);
        }
      } else if (catalog.catalog_id === 'feature_3_catalog') {
        // Mostrar las dos características previas
        const feature1 = this.catalogPath.find(p => p.catalogId === 'feature_1_catalog');
        const feature2 = this.catalogPath.find(p => p.catalogId === 'feature_2_catalog');
        
        if (feature1) {
          const prevBadge1 = document.createElement('div');
          prevBadge1.className = 'selected-feature-badge';
          prevBadge1.innerHTML = `
            <div class="feature-check-icon"></div>
            <span>${feature1.name} Seleccionado</span>
          `;
          wrapper.appendChild(prevBadge1);
        }
        
        if (feature2) {
          const prevBadge2 = document.createElement('div');
          prevBadge2.className = 'selected-feature-badge';
          prevBadge2.innerHTML = `
            <div class="feature-check-icon"></div>
            <span>${feature2.name} Seleccionado</span>
          `;
          wrapper.appendChild(prevBadge2);
        }
      }
    }
    
    // Grid de opciones (2 columnas)
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'feature-options-grid';
    
    catalog.data.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = 'feature-option-btn';
      btn.innerHTML = `
        <span>${item.name}</span>
      `;
      btn.onclick = (e) => {
        e.preventDefault();
        this.log('👉 Click en opción:', item.name);
        this.selectCatalogItem(item, catalog.catalog_id);
      };
      optionsGrid.appendChild(btn);
    });
    
    wrapper.appendChild(optionsGrid);
    
    // Botón "Finalizar Cotización" si es la última característica
    if (catalog.catalog_id === 'feature_3_catalog' || !catalog.data.some(item => item.child)) {
      const finalizeBtn = document.createElement('button');
      finalizeBtn.className = 'finalize-quote-btn';
      finalizeBtn.textContent = 'Finalizar Cotización';
      finalizeBtn.onclick = (e) => {
        e.preventDefault();
        this.calculateAndShowResults();
      };
      wrapper.appendChild(finalizeBtn);
    }
    
    container.appendChild(wrapper);
  }

  renderVehicleTypeSelection(catalog, container) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear estructura principal
    const wrapper = document.createElement('div');
    wrapper.className = 'brand-selection-wrapper';
    
    // Header con botón de volver
    const header = this.createTradeInHeader();
    wrapper.appendChild(header);
    
    // Stepper móvil
    const mobileStepper = this.createMobileStepper();
    wrapper.appendChild(mobileStepper);
    
    // Título
    const title = document.createElement('h3');
    title.className = 'brand-selection-title';
    title.textContent = this.selectedVehicleCategory === 'auto' ? '¿Qué tipo de auto es?' : '¿Qué tipo de moto es?';
    wrapper.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'brand-selection-subtitle';
    subtitle.textContent = 'Selecciona el tipo de vehículo.';
    wrapper.appendChild(subtitle);
    
    // Grid de opciones (similar a marcas populares)
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'popular-brands-grid';
    
    // Colores para los botones
    const vehicleTypeColors = {
      'rodando': { bg: '#3b82f6', text: 'white' },
      'resguardo': { bg: '#10b981', text: 'white' },
      'moto': { bg: '#f97316', text: 'white' }
    };
    
    catalog.data.forEach((item) => {
      const itemName = item.name.toLowerCase();
      let colorConfig = { bg: '#6366f1', text: 'white' };
      
      if (itemName.includes('rodando')) {
        colorConfig = vehicleTypeColors.rodando;
      } else if (itemName.includes('resguardo')) {
        colorConfig = vehicleTypeColors.resguardo;
      } else if (itemName.includes('moto')) {
        colorConfig = vehicleTypeColors.moto;
      }
      
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'brand-card-btn';
      btn.style.backgroundColor = colorConfig.bg;
      btn.style.color = colorConfig.text;
      btn.innerHTML = `
        <span class="brand-name">${item.name}</span>
        <div class="brand-card-decoration"></div>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectCatalogItem(item, catalog.catalog_id);
      });
      optionsGrid.appendChild(btn);
    });
    
    wrapper.appendChild(optionsGrid);
    container.appendChild(wrapper);
  }

  renderYearSelection(catalog, container) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    const vehicleTypeItem = this.catalogPath.find(p => p.catalogId === 'subcategory_vehicles');
    const vehicleTypeName = vehicleTypeItem ? vehicleTypeItem.name : 'el vehículo';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'brand-selection-wrapper';
    
    const header = this.createTradeInHeader();
    wrapper.appendChild(header);
    
    const mobileStepper = this.createMobileStepper();
    wrapper.appendChild(mobileStepper);
    
    const title = document.createElement('h3');
    title.className = 'brand-selection-title';
    title.textContent = '¿Qué año es?';
    wrapper.appendChild(title);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'brand-selection-subtitle';
    subtitle.innerHTML = `Tipo: <strong>${vehicleTypeName}</strong>`;
    wrapper.appendChild(subtitle);
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'brand-search-container';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'brand-search-input';
    searchInput.placeholder = 'Buscar año...';
    searchContainer.appendChild(searchInput);
    wrapper.appendChild(searchContainer);
    
    const yearsList = document.createElement('div');
    yearsList.className = 'other-brands-list';
    
    const renderList = (items) => {
      yearsList.innerHTML = '';
      if (items.length === 0) {
        yearsList.innerHTML = '<div class="no-results">No se encontraron años</div>';
        return;
      }
      
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'brand-list-item model-list-item';
        row.innerHTML = `
          <div class="model-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>${item.name}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        `;
        row.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectCatalogItem(item, catalog.catalog_id);
        });
        yearsList.appendChild(row);
      });
    };
    
    renderList(catalog.data);
    wrapper.appendChild(yearsList);
    container.appendChild(wrapper);
    
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = term === '' ? catalog.data : catalog.data.filter(item => item.name.toLowerCase().includes(term));
      renderList(filtered);
    });
  }

  renderMetalCalculator(catalog, container) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Activar modo de una sola columna en el layout padre
    const layoutContainer = container.closest('.catalog-layout-v2');
    if (layoutContainer) {
      layoutContainer.classList.add('single-column-mode');
    }
    
    // Ocultar panel de detalles explícitamente
    const detailsPanel = document.querySelector('.catalog-details-panel');
    if (detailsPanel) {
      detailsPanel.style.setProperty('display', 'none', 'important');
    }
    
    const isGold = catalog.catalog_id === 'metal_gold_catalog';
    const metalType = isGold ? 'Oro' : 'Plata';
    
    // Crear estructura principal
    const wrapper = document.createElement('div');
    wrapper.className = 'metal-calculator-wrapper';
    
    // Header con botón de volver
    const header = this.createTradeInHeader();
    wrapper.appendChild(header);
    
    // Stepper móvil
    const mobileStepper = this.createMobileStepper();
    wrapper.appendChild(mobileStepper);
    
    // Icono y Título central
    const hero = document.createElement('div');
    hero.className = 'metal-hero';
    hero.innerHTML = `
      <div class="metal-icon-circle">
        <img src="${isGold ? 'https://cdn.shopify.com/s/files/1/0556/2630/1521/files/gold-ring-icon.png?v=1710000000' : 'https://cdn.shopify.com/s/files/1/0556/2630/1521/files/silver-ring-icon.png?v=1710000000'}" alt="${metalType}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
        <svg style="display:none; width: 48px; height: 48px;" viewBox="0 0 24 24" fill="none" stroke="${isGold ? '#fbbf24' : '#9ca3af'}" stroke-width="1.5">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v10M8 12h8"/>
        </svg>
      </div>
      <h2 class="metal-title">${metalType}</h2>
    `;
    wrapper.appendChild(hero);
    
    // Grid de 2 columnas para inputs
    const inputGrid = document.createElement('div');
    inputGrid.className = 'metal-input-grid';
    
    // Columna 1: Kilataje
    const karatCol = document.createElement('div');
    karatCol.className = 'metal-input-col';
    karatCol.innerHTML = `
      <label class="metal-label">SELECCIONA KILATAJE <span class="tooltip-icon" title="El kilataje determina la pureza del metal">?</span></label>
      <select id="metal-karat-select-${this.blockId}" class="metal-select">
        <option value="">Selecciona</option>
      </select>
    `;
    inputGrid.appendChild(karatCol);
    
    // Columna 2: Peso
    const weightCol = document.createElement('div');
    weightCol.className = 'metal-input-col';
    weightCol.innerHTML = `
      <label class="metal-label">INDICA EL PESO EN GRAMOS</label>
      <input type="number" id="metal-weight-input-${this.blockId}" class="metal-input" placeholder="0.0" step="0.1" min="0">
    `;
    inputGrid.appendChild(weightCol);
    
    wrapper.appendChild(inputGrid);
    
    // Botones de acción
    const actionRow = document.createElement('div');
    actionRow.className = 'metal-action-row';
    
    const simulateBtn = document.createElement('button');
    simulateBtn.className = 'metal-btn-secondary';
    simulateBtn.textContent = 'SIMULAR OTRO ARTÍCULO';
    simulateBtn.onclick = () => this.resetCatalog();
    
    const calculateBtn = document.createElement('button');
    calculateBtn.className = 'metal-btn-primary';
    calculateBtn.textContent = '¡QUIERO MI PRÉSTAMO!';
    calculateBtn.disabled = true; // Deshabilitado por defecto
    
    actionRow.appendChild(simulateBtn);
    actionRow.appendChild(calculateBtn);
    wrapper.appendChild(actionRow);
    
    container.appendChild(wrapper);
    
    // Llenar select de kilataje
    const karatSelect = document.getElementById(`metal-karat-select-${this.blockId}`);
    catalog.data.forEach(item => {
      const option = document.createElement('option');
      option.value = JSON.stringify(item);
      option.textContent = item.name;
      karatSelect.appendChild(option);
    });
    
    // Lógica de validación y cálculo
    const weightInput = document.getElementById(`metal-weight-input-${this.blockId}`);
    
    const validateForm = () => {
      const karatSelected = karatSelect.value !== '';
      const weightValue = parseFloat(weightInput.value);
      const weightValid = !isNaN(weightValue) && weightValue > 0;
      
      calculateBtn.disabled = !(karatSelected && weightValid);
      
      if (calculateBtn.disabled) {
        calculateBtn.classList.add('disabled');
      } else {
        calculateBtn.classList.remove('disabled');
      }
    };
    
    karatSelect.addEventListener('change', validateForm);
    weightInput.addEventListener('input', validateForm);
    
    calculateBtn.onclick = async () => {
      if (calculateBtn.disabled) return;
      
      const item = JSON.parse(karatSelect.value);
      const weight = parseFloat(weightInput.value);
      
      // Añadir al path para referencia
      this.catalogPath.push({
        ...item,
        catalogId: catalog.catalog_id,
        userWeight: weight
      });
      
      // Mostrar loader
      const loadingDiv = document.getElementById(`loading-${this.blockId}`);
      if (loadingDiv) loadingDiv.style.setProperty('display', 'flex', 'important');
      
      // Llamar a la API de precio directamente
      // El payload para metales necesita params: { karat: XX, weight: YY }
      // Necesitamos adaptar `calculateAndShowResults` o llamarlo con parámetros especiales
      
      // En este caso, como tenemos datos específicos (peso), vamos a guardar esto en una variable temporal
      // o modificar `calculateAndShowResults` para que lea el peso del path.
      
      this.calculateAndShowResults();
    };
  }

  attachDropdownListener(dropdown, catalogData, catalogId) {
    // Guardar referencia al catalog.data para usar como fallback
    const catalogDataRef = catalogData;
    const catalogIdRef = catalogId;
    
    // Remover listeners anteriores si existen
    const newDropdown = dropdown.cloneNode(true);
    newDropdown.disabled = false; // Asegurar que el nuevo dropdown esté habilitado
    dropdown.parentNode.replaceChild(newDropdown, dropdown);
    
    // Agregar event listener al nuevo dropdown
    newDropdown.addEventListener('change', (e) => {
      const selectedIndex = e.target.value;
      if (selectedIndex === '') return;
      
      const index = parseInt(selectedIndex);
      
      // Intentar obtener el item del dataset primero
      const selectedOption = e.target.options[index + 1]; // +1 porque el índice 0 es la opción por defecto
      let itemData = null;
      
      if (selectedOption && selectedOption.dataset.item) {
        try {
          itemData = JSON.parse(selectedOption.dataset.item);
        } catch (error) {
          console.warn('⚠️ Error parseando dataset, usando fallback:', error);
        }
      }
      
      // Fallback: obtener directamente del array catalog.data
      if (!itemData && catalogDataRef && catalogDataRef[index]) {
        itemData = catalogDataRef[index];
      }
      
      if (!itemData) {
        console.error('❌ No se pudo obtener el item seleccionado');
        console.error('❌ Index:', index);
        console.error('❌ Opción seleccionada:', selectedOption);
        console.error('❌ Catalog data disponible:', !!catalogDataRef);
        return;
      }
      
      // Ocultar el dropdown actual cuando se selecciona una opción
      const dropdownWrapper = newDropdown.closest('.catalog-dropdown-wrapper');
      if (dropdownWrapper) {
        dropdownWrapper.style.display = 'none';
        dropdownWrapper.style.visibility = 'hidden';
        dropdownWrapper.style.opacity = '0';
      }
      
      // Ocultar el texto de ayuda cuando se selecciona una opción
      const helpText = document.getElementById(`dropdown-help-${this.blockId}`);
      if (helpText) {
        helpText.style.display = 'none';
        helpText.style.visibility = 'hidden';
        helpText.style.opacity = '0';
      }
      
      // Deshabilitar el dropdown temporalmente para evitar múltiples clicks
      newDropdown.disabled = true;
      
      this.log(`🔘 Dropdown cambiado! Item seleccionado:`, itemData);
      this.log(`🔘 CatalogId:`, catalogIdRef);
      this.log(`🔘 Llamando a selectCatalogItem...`);
      
      // Llamar a selectCatalogItem que actualizará el panel izquierdo y cargará el siguiente catálogo
      try {
        this.selectCatalogItem(itemData, catalogIdRef);
      } catch (error) {
        console.error(`❌ Error en selectCatalogItem:`, error);
      }
    });
  }

  getDropdownLabel(catalogId) {
    const labels = {
      'subcategory_miscellaneous': 'Tipo de artículo',
      'brand_catalog': '¿Qué marca es?',
      'model_catalog': '¿Qué modelo es?',
      'feature_1_catalog': 'Característica 1',
      'feature_2_catalog': 'Característica 2',
      'feature_3_catalog': 'Característica 3',
      'metal_gold_catalog': 'Tipo de metal',
      'metal_silver_catalog': 'Tipo de metal',
      'diamond_color_catalog': 'Color',
      'diamond_clarity_catalog': 'Claridad',
      'diamond_size_catalog': 'Tamaño',
      'subcategory_vehicles': 'Tipo de vehículo',
      'year_vehicles': 'Año',
      'brand_vehicles': '¿Qué marca es?',
      'model_vehicles': '¿Qué modelo es?',
      'version_vehicles': 'Versión'
    };
    
    return labels[catalogId] || 'Selecciona una opción';
  }

  getDropdownPlaceholder(catalogId) {
    const placeholders = {
      'subcategory_miscellaneous': 'Selecciona una opción',
      'brand_catalog': 'Ingrese marca',
      'model_catalog': 'Ingrese modelo',
      'feature_1_catalog': 'Selecciona una opción',
      'feature_2_catalog': 'Selecciona una opción',
      'feature_3_catalog': 'Selecciona una opción',
      'brand_vehicles': 'Ingrese marca',
      'model_vehicles': 'Ingrese modelo'
    };
    
    return placeholders[catalogId] || 'Selecciona una opción';
  }

  selectCatalogItem(item, catalogId) {
    this.log(`🎯 selectCatalogItem llamado con:`, item.name, catalogId);
    
    // Limpiar contenido actual inmediatamente para mostrar solo el loader
    const dropdownsContainer = document.getElementById(`catalog-dropdowns-${this.blockId}`);
    if (dropdownsContainer) {
      // Limpiar completamente el contenedor
      dropdownsContainer.innerHTML = '';
      dropdownsContainer.style.setProperty('display', 'flex', 'important');
      dropdownsContainer.style.setProperty('visibility', 'visible', 'important');
      
      // Mostrar loader explícitamente
      const loadingDiv = document.getElementById(`loading-${this.blockId}`);
      if (loadingDiv) {
        loadingDiv.style.setProperty('display', 'flex', 'important');
        loadingDiv.style.setProperty('visibility', 'visible', 'important');
        loadingDiv.style.setProperty('opacity', '1', 'important');
      }
    }

    this.catalogPath.push({ ...item, catalogId });
    this.log(`📦 CatalogPath ahora tiene ${this.catalogPath.length} items:`, this.catalogPath.map(i => i.name));
    
    // Actualizar panel de detalles inmediatamente
    this.log(`🔄 Llamando a updateDetailsPanel...`);
    this.log(`🔍 Verificando método:`, typeof this.updateDetailsPanel);
    this.log(`🔍 Contexto this:`, this);
    try {
      if (typeof this.updateDetailsPanel === 'function') {
        this.log(`✅ Método existe, ejecutando...`);
        const result = this.updateDetailsPanel();
        this.log(`✅ updateDetailsPanel ejecutado, resultado:`, result);
      } else {
        console.error(`❌ updateDetailsPanel no es una función!`);
      }
    } catch (error) {
      console.error(`❌ ERROR CAPTURADO en updateDetailsPanel:`, error);
      console.error(`❌ Mensaje:`, error.message);
      console.error(`❌ Stack:`, error.stack);
    }
    
    // Determinar el siguiente catálogo basándose en el catalogId actual
    const nextCatalog = this.getNextCatalog(catalogId, item);
    
    if (nextCatalog) {
      this.loadCatalog(nextCatalog.catalogId, nextCatalog.params);
      
      // No hacer scroll automático - mantener posición actual
    } else {
      this.calculateAndShowResults();
    }
  }

  updateDetailsPanel() {
    this.log(`🚀🚀🚀 updateDetailsPanel() EJECUTÁNDOSE AHORA!!!`);
    this.log(`🔍🔍🔍 updateDetailsPanel() INICIANDO...`);
    this.log(`🔍 Buscando elemento: details-content-${this.blockId}`);
    this.log(`🔍 BlockId: ${this.blockId}`);
    this.log(`🔍 CatalogPath:`, this.catalogPath);
    
    try {
      this.log(`🔍 Dentro del try, buscando elemento...`);
      const detailsPanel = document.getElementById(`details-content-${this.blockId}`);
      this.log(`🔍 Elemento encontrado:`, detailsPanel);
    
    if (!detailsPanel) {
      console.error(`❌ ERROR: No se encontró el panel de detalles: details-content-${this.blockId}`);
      console.error(`❌ BlockId actual: ${this.blockId}`);
      // Intentar buscar el elemento de otra forma
      const altPanel = document.querySelector(`[id*="details-content"]`);
      if (altPanel) {
        console.warn(`⚠️ Encontrado elemento alternativo:`, altPanel.id);
      } else {
        console.error(`❌ No se encontró ningún elemento con 'details-content' en el ID`);
      }
      return;
    }
    
    this.log(`✅ Panel encontrado!`, detailsPanel);
    this.log(`📝 Actualizando panel de detalles. CatalogPath length: ${this.catalogPath.length}`);
    
    // Si no hay selecciones aún, mostrar estado vacío
    if (this.catalogPath.length === 0) {
      detailsPanel.innerHTML = `
        <div class="details-empty-state">
          Selecciona las opciones para ver el detalle de tu cotización
        </div>
      `;
      return;
    }
    
    // Mapeo de catalogIds a etiquetas
    const catalogLabels = {
      'subcategory_miscellaneous': 'Tipo de artículo',
      'brand_catalog': 'Marca',
      'model_catalog': 'Modelo',
      'feature_1_catalog': 'Característica',
      'feature_2_catalog': 'Característica',
      'feature_3_catalog': 'Característica',
      'metal_gold_catalog': 'Tipo de Metal',
      'metal_silver_catalog': 'Tipo de Metal',
      'diamond_color_catalog': 'Color',
      'diamond_clarity_catalog': 'Claridad',
      'diamond_size_catalog': 'Tamaño',
      'subcategory_vehicles': 'Tipo de Vehículo',
      'year_vehicles': 'Año',
      'brand_vehicles': 'Marca',
      'model_vehicles': 'Modelo',
      'version_vehicles': 'Versión'
    };
    
    // Construir HTML con los detalles seleccionados
    let html = '<h3 class="details-title">Detalle de tu artículo</h3>';
    html += '<div class="details-items">';
    
    this.catalogPath.forEach((item, index) => {
      let label = catalogLabels[item.catalogId];
      
      if (!label) {
        if (item.brand_id) label = 'Marca';
        else if (item.charat1_id || item.charat2_id || item.charat3_id) label = 'Característica';
        else if (item.model_id) label = 'Modelo';
      }
      
      if (label && item.name) {
        html += `
          <div class="detail-item" data-step-index="${index}">
            <span class="detail-label">${label}:</span>
            <span class="detail-value">${item.name}</span>
          </div>
        `;
        this.log(`✅ Agregando detalle: ${label} - ${item.name}`);
      } else {
        console.warn(`⚠️ Item sin label o name:`, item);
      }
    });
    
    html += '</div>';
    detailsPanel.innerHTML = html;
    this.log(`✅ Panel de detalles actualizado con ${this.catalogPath.length} items`);
    
    // Actualizar progress stepper (desktop)
    const progressStepper = document.getElementById(`progress-stepper-${this.blockId}`);
    if (progressStepper) {
      const steps = progressStepper.querySelectorAll('.progress-step');
      steps.forEach((step, index) => {
        if (index < this.catalogPath.length) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });
    }
    
    // Actualizar mobile stepper
    this.updateMobileStepper();
    
    // Hacer los items clickeables para volver a ese paso
    const detailItems = detailsPanel.querySelectorAll('.detail-item');
    detailItems.forEach((item, index) => {
      item.style.cursor = 'pointer';
      // Remover listeners anteriores para evitar duplicados
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      newItem.addEventListener('click', () => {
        this.goToStep(index);
      });
    });
    } catch (error) {
      console.error(`❌ ERROR dentro de updateDetailsPanel:`, error);
      console.error(`❌ Stack:`, error.stack);
    }
  }

  getNextCatalog(currentCatalogId, currentItem) {
    // Helper function para extraer vehicle_type de un item
    const extractVehicleType = (item) => {
      if (!item) return '';
      
      if (item.child_ids && Array.isArray(item.child_ids)) {
        const vehicleTypeChild = item.child_ids.find(c => c.name === 'vehicle_type');
        if (vehicleTypeChild) {
          return vehicleTypeChild.id || vehicleTypeChild.value || '';
        }
      }
      
      // Fallback: buscar en el item directamente
      if (item.vehicle_type) return item.vehicle_type;
      
      // Fallback adicional: basado en el nombre
      if (item.name) {
        const itemName = item.name.toLowerCase();
        if (itemName.includes('rodando')) return '2';
        if (itemName.includes('resguardo')) return '1';
      }
      
      return '';
    };
    
    // Flujo para electrónicos (subcategory_miscellaneous)
    if (currentCatalogId === 'subcategory_miscellaneous') {
      // El siguiente es brand_catalog, necesita id_pledge_lakin
      const id_pledge_lakin = currentItem.id_pledge_Lakin || 
                              currentItem.id_pledge_lakin || 
                              currentItem.child_ids?.find(c => c.name === 'id_pledge_lakin')?.value ||
                              60; // default
      
      return {
        catalogId: 'brand_catalog',
        params: { id_pledge_lakin: id_pledge_lakin }
      };
    }
    
    // Flujo para marcas (brand_catalog)
    if (currentCatalogId === 'brand_catalog') {
      // El siguiente es model_catalog, necesita id_pledge_lakin y brand_id
      const pathItem = this.catalogPath.find(p => p.catalogId === 'subcategory_miscellaneous');
      const id_pledge_lakin = pathItem?.id_pledge_Lakin || 
                              pathItem?.id_pledge_lakin || 
                              pathItem?.child_ids?.find(c => c.name === 'id_pledge_lakin')?.value ||
                              60;
      
      return {
        catalogId: 'model_catalog',
        params: { 
          id_pledge_lakin: id_pledge_lakin,
          brand_id: currentItem.brand_id || ''
        }
      };
    }
    
    // Flujo para modelos (model_catalog)
    if (currentCatalogId === 'model_catalog') {
      // El siguiente es feature_1_catalog
      const pathItem = this.catalogPath.find(p => p.catalogId === 'subcategory_miscellaneous');
      const brandItem = this.catalogPath.find(p => p.catalogId === 'brand_catalog');
      const id_pledge_lakin = pathItem?.id_pledge_Lakin || 
                              pathItem?.id_pledge_lakin || 
                              pathItem?.child_ids?.find(c => c.name === 'id_pledge_lakin')?.value ||
                              60;
      
      return {
        catalogId: 'feature_1_catalog',
        params: { 
          id_pledge_lakin: id_pledge_lakin,
          brand_id: brandItem?.brand_id || '',
          model_id: currentItem.model_id || ''
        }
      };
    }
    
    // Flujo para características 1 (feature_1_catalog)
    if (currentCatalogId === 'feature_1_catalog') {
      // El siguiente es feature_2_catalog
      const pathItem = this.catalogPath.find(p => p.catalogId === 'subcategory_miscellaneous');
      const brandItem = this.catalogPath.find(p => p.catalogId === 'brand_catalog');
      const modelItem = this.catalogPath.find(p => p.catalogId === 'model_catalog');
      const id_pledge_lakin = pathItem?.id_pledge_Lakin || 
                              pathItem?.id_pledge_lakin || 
                              pathItem?.child_ids?.find(c => c.name === 'id_pledge_lakin')?.value ||
                              60;
      
      return {
        catalogId: 'feature_2_catalog',
        params: { 
          id_pledge_lakin: id_pledge_lakin,
          brand_id: brandItem?.brand_id || '',
          model_id: modelItem?.model_id || '',
          charat1_id: currentItem.charat1_id || ''
        }
      };
    }
    
    // Flujo para características 2 (feature_2_catalog)
    if (currentCatalogId === 'feature_2_catalog') {
      // El siguiente es feature_3_catalog
      const pathItem = this.catalogPath.find(p => p.catalogId === 'subcategory_miscellaneous');
      const brandItem = this.catalogPath.find(p => p.catalogId === 'brand_catalog');
      const modelItem = this.catalogPath.find(p => p.catalogId === 'model_catalog');
      const feature1Item = this.catalogPath.find(p => p.catalogId === 'feature_1_catalog');
      const id_pledge_lakin = pathItem?.id_pledge_Lakin || 
                              pathItem?.id_pledge_lakin || 
                              pathItem?.child_ids?.find(c => c.name === 'id_pledge_lakin')?.value ||
                              60;
      
      return {
        catalogId: 'feature_3_catalog',
        params: { 
          id_pledge_lakin: id_pledge_lakin,
          brand_id: brandItem?.brand_id || '',
          model_id: modelItem?.model_id || '',
          charat1_id: feature1Item?.charat1_id || '',
          charat2_id: currentItem.charat2_id || ''
        }
      };
    }
    
    // Flujo para vehículos
    // Flujo para vehículos
    if (currentCatalogId === 'subcategory_vehicles') {
      // Extraer vehicle_type del item seleccionado
      let vehicleType = extractVehicleType(currentItem);
      
      this.log('🚗 Vehicle Type extraído:', vehicleType, 'del item:', currentItem);
      
      if (!vehicleType) {
        console.error('❌ No se pudo extraer vehicle_type del item:', currentItem);
        // Fallback basado en el nombre
        if (currentItem.name && currentItem.name.toLowerCase().includes('rodando')) {
          vehicleType = '2';
        } else if (currentItem.name && currentItem.name.toLowerCase().includes('resguardo')) {
          vehicleType = '1';
        } else {
          vehicleType = '1';
        }
        this.log('⚠️ Usando vehicle_type por defecto:', vehicleType);
      }
      
      return {
        catalogId: 'year_vehicles',
        params: { vehicle_type: vehicleType }
      };
    }
    
    if (currentCatalogId === 'year_vehicles') {
      const vehicleItem = this.catalogPath.find(p => p.catalogId === 'subcategory_vehicles');
      const vehicleType = extractVehicleType(vehicleItem);
      
      return {
        catalogId: 'brand_vehicles',
        params: { 
          vehicle_type: vehicleType,
          year: currentItem.id || currentItem.name 
        }
      };
    }
    
    if (currentCatalogId === 'brand_vehicles') {
      const vehicleItem = this.catalogPath.find(p => p.catalogId === 'subcategory_vehicles');
      const yearItem = this.catalogPath.find(p => p.catalogId === 'year_vehicles');
      const vehicleType = extractVehicleType(vehicleItem);
      
      return {
        catalogId: 'model_vehicles',
        params: { 
          vehicle_type: vehicleType,
          year: yearItem?.id || yearItem?.name,
          brand: currentItem.id
        }
      };
    }
    
    if (currentCatalogId === 'model_vehicles') {
      const vehicleItem = this.catalogPath.find(p => p.catalogId === 'subcategory_vehicles');
      const yearItem = this.catalogPath.find(p => p.catalogId === 'year_vehicles');
      const brandItem = this.catalogPath.find(p => p.catalogId === 'brand_vehicles');
      const vehicleType = extractVehicleType(vehicleItem);
      
      return {
        catalogId: 'version_vehicles',
        params: { 
          vehicle_type: vehicleType,
          year: yearItem?.id || yearItem?.name,
          brand: brandItem?.id,
          model: currentItem.id
        }
      };
    }
    
    // Si el item tiene child directo, usarlo
    if (currentItem.child && currentItem.child !== false && currentItem.child !== 'false') {
      const params = this.extractParamsFromPath();
      return {
        catalogId: currentItem.child,
        params: params
      };
    }
    
    // No hay más niveles
    return null;
  }

  extractParamsFromPath() {
    const params = {};
    this.catalogPath.forEach(item => {
      if (item.child_ids && Array.isArray(item.child_ids)) {
        item.child_ids.forEach(child => {
          if (child.name && child.value) params[child.name] = child.value;
          if (child.name && child.id) params[child.name] = child.id;
        });
      }
      if (item.id_pledge_Lakin) params.id_pledge_lakin = item.id_pledge_Lakin;
      if (item.id_pledge_lakin) params.id_pledge_lakin = item.id_pledge_lakin;
      if (item.brand_id) params.brand_id = item.brand_id;
      if (item.model_id) params.model_id = item.model_id;
      if (item.charat1_id) params.charat1_id = item.charat1_id;
      if (item.charat2_id) params.charat2_id = item.charat2_id;
      if (item.catalogId === 'year_vehicles') params.year = item.id || item.name;
      if (item.catalogId === 'brand_vehicles') params.brand = item.id;
      if (item.catalogId === 'model_vehicles') params.model = item.id;
    });
    return params;
  }

  async calculateAndShowResults() {
    // Mostrar loader con mensaje mientras se calculan los resultados
    const loadingDiv = document.getElementById(`loading-${this.blockId}`);
    const dropdownsContainer = document.getElementById(`catalog-dropdowns-${this.blockId}`);
    
    if (loadingDiv && dropdownsContainer) {
      // Ocultar dropdowns y mostrar loader
      dropdownsContainer.style.display = 'none';
      
      // Configurar loader centrado con mensaje
      loadingDiv.style.setProperty('display', 'flex', 'important');
      loadingDiv.style.setProperty('flex-direction', 'column', 'important');
      loadingDiv.style.setProperty('align-items', 'center', 'important');
      loadingDiv.style.setProperty('justify-content', 'center', 'important');
      loadingDiv.style.setProperty('visibility', 'visible', 'important');
      loadingDiv.style.setProperty('opacity', '1', 'important');
      loadingDiv.style.setProperty('background', 'transparent', 'important');
      loadingDiv.style.setProperty('min-height', '200px', 'important');
      
      // Ocultar skeleton si existe
      const skeletonLoader = loadingDiv.querySelector('.skeleton-loader');
      if (skeletonLoader) {
        skeletonLoader.style.setProperty('display', 'none', 'important');
      }
      
      // Mostrar spinner y agregar mensaje
      const spinnerLoader = loadingDiv.querySelector('.spinner-loader');
      if (spinnerLoader) {
        spinnerLoader.style.setProperty('display', 'flex', 'important');
        spinnerLoader.style.setProperty('visibility', 'visible', 'important');
        spinnerLoader.style.setProperty('opacity', '1', 'important');
        spinnerLoader.style.setProperty('flex-direction', 'column', 'important');
        spinnerLoader.style.setProperty('align-items', 'center', 'important');
        spinnerLoader.style.setProperty('gap', '16px', 'important');
        
        // Asegurar que el spinner interno sea grande
        const spinner = spinnerLoader.querySelector('.spinner');
        if (spinner) {
          spinner.style.setProperty('width', '56px', 'important');
          spinner.style.setProperty('height', '56px', 'important');
          spinner.style.setProperty('min-width', '56px', 'important');
          spinner.style.setProperty('min-height', '56px', 'important');
          spinner.style.setProperty('border-width', '4px', 'important');
        }
        
        // Agregar mensaje de procesamiento si no existe
        let processingMessage = spinnerLoader.querySelector('.processing-message');
        if (!processingMessage) {
          processingMessage = document.createElement('div');
          processingMessage.className = 'processing-message';
          processingMessage.textContent = 'Estamos procesando tu solicitud...';
          spinnerLoader.appendChild(processingMessage);
        } else {
          processingMessage.style.setProperty('display', 'block', 'important');
        }
      }
    }
    
    try {
      const priceParams = this.buildPriceParams();
      
      // Calculate price
      const priceResponse = await fetch(`${this.API_URL}/simulator/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY
        },
        body: JSON.stringify({ data: priceParams })
      });
      
      if (!priceResponse.ok) {
        const errorText = await priceResponse.text();
        console.error('Price error:', errorText);
        throw new Error(`Error calculando precio: ${priceResponse.status}`);
      }
      
      const priceResult = await priceResponse.json();
      
      // Get loan options
      const loanBody = {
        data: {
          category_id: priceParams.category_id,
          pledge_id: priceParams.pledge_id,
          price: priceResult.price,
          ...(priceParams.category_id === 2 || priceParams.category_id === 6 ? { params: priceParams.params } : {})
        }
      };
      
      if (priceParams.category_id === 2 || priceParams.category_id === 6) {
        loanBody.location = {
          user_id: "", state: "", delegation: "", colony: "", cp: "",
          category: priceParams.category_id === 2 ? "Autos y Motos" : "Motos",
          category_id: String(priceParams.category_id)
        };
      }
      
      const loanResponse = await fetch(`${this.API_URL}/simulator/type-loan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY
        },
        body: JSON.stringify(loanBody)
      });
      
      if (!loanResponse.ok) {
        const errorText = await loanResponse.text();
        console.error('Loan error:', errorText);
        throw new Error(`Error obteniendo préstamos: ${loanResponse.status}`);
      }
      
      const loanResult = await loanResponse.json();
      
      // Ocultar loader y mensaje antes de mostrar resultados
      if (loadingDiv) {
        loadingDiv.style.setProperty('display', 'none', 'important');
        
        // Ocultar mensaje de procesamiento si existe
        const spinnerLoader = loadingDiv.querySelector('.spinner-loader');
        if (spinnerLoader) {
          const processingMessage = spinnerLoader.querySelector('.processing-message');
          if (processingMessage) {
            processingMessage.style.setProperty('display', 'none', 'important');
          }
        }
      }
      
      this.currentProduct = {
        name: this.catalogPath.map(p => p.name).join(' > '),
        path: this.catalogPath,
        price: priceResult.price,
        priceParams: priceParams
      };
      this.currentLoanData = loanResult;
      
      this.displayResults();
      
    } catch (error) {
      console.error('Error:', error);
      
      // Ocultar loader y mensaje en caso de error
      if (loadingDiv) {
        loadingDiv.style.setProperty('display', 'none', 'important');
        
        // Ocultar mensaje de procesamiento si existe
        const spinnerLoader = loadingDiv.querySelector('.spinner-loader');
        if (spinnerLoader) {
          const processingMessage = spinnerLoader.querySelector('.processing-message');
          if (processingMessage) {
            processingMessage.style.setProperty('display', 'none', 'important');
          }
        }
      }
      
      // Mostrar error en el contenedor de dropdowns
      if (dropdownsContainer) {
        dropdownsContainer.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 2rem;">Error procesando la solicitud<br><small>${error.message}</small></p>`;
        dropdownsContainer.style.display = 'flex';
      } else {
      alert('Error procesando la solicitud. Por favor intenta de nuevo.');
      }
    }
  }

  buildPriceParams() {
    const firstItem = this.catalogPath[0];
    const catalogId = firstItem.catalogId;
    let category_id = 1, pledge_id = 4;
    const params = {};
    
    if (catalogId === 'metal_gold_catalog' || catalogId === 'metal_silver_catalog') {
      category_id = 1;
      pledge_id = 4;
      
      // Buscar item seleccionado en el path (kilataje)
      const karatItem = this.catalogPath.find(p => p.catalogId === 'metal_gold_catalog' || p.catalogId === 'metal_silver_catalog');
      
      params.karat = karatItem?.karat_id || 14;
      // Usar el peso ingresado por el usuario, guardado en el item del path
      params.weight = karatItem?.userWeight || 1.0;
      
    } else if (catalogId.includes('diamond')) {
      category_id = 1;
      pledge_id = 11;
      const color = this.catalogPath.find(p => p.catalogId === 'diamond_color_catalog');
      const clarity = this.catalogPath.find(p => p.catalogId === 'diamond_clarity_catalog');
      const size = this.catalogPath.find(p => p.catalogId === 'diamond_size_catalog');
      params.amount = 1;
      params.clarity_id = clarity?.clarity_id || 1;
      params.colour_id = color?.colour_id || 1;
      params.karats = size?.karat || 0.1;
      params.karats_id = size?.karat_id || 1;
      params.old_cut = "0";
    } else if (catalogId === 'subcategory_miscellaneous' || this.currentCategory === 'electronics') {
      category_id = 5;
      const pledgeFromPath = this.catalogPath[0]?.id_pledge_Lakin || 
                            this.catalogPath[0]?.id_pledge_lakin || 
                            this.catalogPath[0]?.child_ids?.find(c => c.name === 'id_pledge_lakin')?.value;
      pledge_id = parseInt(pledgeFromPath) || 60;
      const brand = this.catalogPath.find(p => p.brand_id);
      const model = this.catalogPath.find(p => p.model_id);
      const f1 = this.catalogPath.find(p => p.charat1_id);
      const f2 = this.catalogPath.find(p => p.charat2_id);
      const f3 = this.catalogPath.find(p => p.charat3_id);
      params.brand_id = brand?.brand_id || "";
      params.model_id = model?.model_id || "";
      params.feature1_id = f1?.charat1_id || "";
      params.feature2_id = f2?.charat2_id || "";
      params.feature3_id = f3?.charat3_id || "";
    } else if (catalogId === 'subcategory_vehicles' || this.currentCategory === 'vehicles') {
      category_id = 2;
      const vehicleType = this.catalogPath[0]?.child_ids?.find(c => c.name === 'vehicle_type')?.id;
      pledge_id = vehicleType === "2" ? 2 : 1;
      const year = this.catalogPath.find(p => p.catalogId === 'year_vehicles');
      const brand = this.catalogPath.find(p => p.catalogId === 'brand_vehicles');
      const model = this.catalogPath.find(p => p.catalogId === 'model_vehicles');
      const version = this.catalogPath.find(p => p.catalogId === 'version_vehicles');
      params.vehicle = this.catalogPath[0]?.child_ids?.find(c => c.name === 'vehicle')?.id || "0";
      params.brand_id = brand?.id || "";
      params.model_id = model?.id || "";
      params.version_id = version?.id || "";
      params.year = year?.id || year?.name || "";
    }
    
    return { category_id, pledge_id, params };
  }

  displayResults() {
    document.getElementById(`catalog-nav-${this.blockId}`).style.display = 'none';
    document.getElementById(`main-panels-${this.blockId}`).style.display = 'block';
    
    // No hacer scroll automático - mantener posición actual
    
    // Actualizar progress stepper para mostrar todos los pasos completados
    const progressStepper = document.getElementById(`progress-stepper-results-${this.blockId}`);
    if (progressStepper) {
      const steps = progressStepper.querySelectorAll('.progress-step');
      steps.forEach(step => step.classList.add('active'));
    }
    
    this.displayProductDetails();
    
    // Asegurarnos de que selectedPlan tiene un valor por defecto
    if (!this.selectedPlan) {
      this.selectedPlan = 'tradicional';
    }
    
    // Inicializar toggle background con clases pos-left/pos-right
    const toggleBg = document.getElementById(`toggle-bg-${this.blockId}`);
    if (toggleBg && this.selectedPlan === 'tradicional') {
      toggleBg.classList.remove('pos-right');
      toggleBg.classList.add('pos-left');
    }
    
    this.selectPlan(this.selectedPlan);
    
    // Configurar listeners de los botones del toggle (asegurar que funcionen)
    const btnTradicional = document.getElementById(`btn-tradicional-${this.blockId}`);
    const btnFijo = document.getElementById(`btn-fijo-${this.blockId}`);
    
    if (btnTradicional) {
      // Remover listeners anteriores si existen
      const newBtnTradicional = btnTradicional.cloneNode(true);
      btnTradicional.parentNode.replaceChild(newBtnTradicional, btnTradicional);
      newBtnTradicional.addEventListener('click', () => this.selectPlan('tradicional'));
    }
    
    if (btnFijo) {
      // Remover listeners anteriores si existen
      const newBtnFijo = btnFijo.cloneNode(true);
      btnFijo.parentNode.replaceChild(newBtnFijo, btnFijo);
      newBtnFijo.addEventListener('click', () => this.selectPlan('fijo'));
    }
    
    // Configurar los botones "Volver" para reiniciar
    const backBtn = document.getElementById(`btn-simulate-${this.blockId}`);
    if (backBtn) {
      backBtn.onclick = (e) => {
        e.preventDefault();
        this.resetCatalog();
      };
    }
    
    const backBtnLoan = document.getElementById(`btn-simulate-loan-${this.blockId}`);
    if (backBtnLoan) {
      backBtnLoan.onclick = (e) => {
        e.preventDefault();
        this.resetCatalog();
      };
    }
    
    // Configurar el botón "Confirmar Préstamo"
    const btnContinue = document.getElementById(`btn-continue-${this.blockId}`);
    if (btnContinue) {
      // Remover listeners anteriores si existen
      const newBtnContinue = btnContinue.cloneNode(true);
      btnContinue.parentNode.replaceChild(newBtnContinue, btnContinue);
      newBtnContinue.addEventListener('click', () => {
        this.log('Botón Confirmar Préstamo clickeado');
        this.showContactForm();
      });
    } else {
      console.warn(`Botón btn-continue-${this.blockId} no encontrado`);
    }
  }

  displayProductDetails() {
    // Actualizar panel izquierdo de detalles
    const detailsDiv = document.getElementById(`product-details-${this.blockId}`);
    if (detailsDiv) {
      const catalogLabels = {
        'subcategory_miscellaneous': 'Tipo de artículo',
        'brand_catalog': 'Marca',
        'model_catalog': 'Modelo',
        'feature_1_catalog': 'Característica',
        'feature_2_catalog': 'Característica',
        'feature_3_catalog': 'Característica',
        'metal_gold_catalog': 'Tipo de Metal',
        'metal_silver_catalog': 'Tipo de Metal',
        'diamond_color_catalog': 'Color',
        'diamond_clarity_catalog': 'Claridad',
        'diamond_size_catalog': 'Tamaño',
        'subcategory_vehicles': 'Tipo de Vehículo',
        'year_vehicles': 'Año',
        'brand_vehicles': 'Marca',
        'model_vehicles': 'Modelo',
        'version_vehicles': 'Versión'
      };
      
      let html = '<h3 class="details-title">Detalle de tu artículo</h3>';
      html += '<div class="details-items">';
      
      this.catalogPath.forEach((item, index) => {
        let label = catalogLabels[item.catalogId];
        
        if (!label) {
          if (item.brand_id) label = 'Marca';
          else if (item.charat1_id || item.charat2_id || item.charat3_id) label = 'Característica';
          else if (item.model_id) label = 'Modelo';
        }
        
        if (label && item.name) {
          html += `
            <div class="detail-item" data-step-index="${index}">
              <span class="detail-label">${label}:</span>
              <span class="detail-value">${item.name}</span>
            </div>
          `;
        }
      });
      
      html += '</div>';
    detailsDiv.innerHTML = html;
      
      // Hacer los items clickeables para volver a ese paso
      const detailItems = detailsDiv.querySelectorAll('.detail-item');
      detailItems.forEach((item, index) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          this.goToStep(index);
        });
      });
    }
    
    // Actualizar card del artículo en la columna izquierda verde
    const articleDetailsDiv = document.getElementById(`article-details-${this.blockId}`);
    if (articleDetailsDiv) {
      let modelName = '';
      let brandName = '';
      const characteristics = [];

      this.catalogPath.forEach((item) => {
        if (item.catalogId === 'model_catalog' || item.catalogId === 'model_vehicles') {
          modelName = item.name;
        } else if (item.catalogId === 'brand_catalog' || item.catalogId === 'brand_vehicles') {
          brandName = item.name;
        } else if (item.catalogId && item.catalogId.includes('feature_')) {
          characteristics.push(item.name);
        } else if (item.charat1_id || item.charat2_id || item.charat3_id) {
          // También capturar características por ID si no tienen catalogId con 'feature_'
          if (item.name) characteristics.push(item.name);
        }
      });

      let html = `<h3 class="article-title">${modelName || 'Artículo Desconocido'}</h3>`;
      if (brandName || characteristics.length > 0) {
        html += `<div class="article-meta">`;
        if (brandName) {
          html += `<span>${brandName}</span>`;
        }
        if (brandName && characteristics.length > 0) {
          html += `<span>•</span>`;
        }
        if (characteristics.length > 0) {
          html += `<span>${characteristics.join(' • ')}</span>`;
        }
        html += `</div>`;
      }

      articleDetailsDiv.innerHTML = html;
    } else {
      console.warn(`No se encontró el elemento article-details-${this.blockId}`);
    }
  }

  selectPlan(plan) {
    this.selectedPlan = plan;
    
    const btnTradicional = document.getElementById(`btn-tradicional-${this.blockId}`);
    const btnFijo = document.getElementById(`btn-fijo-${this.blockId}`);
    const toggleBg = document.getElementById(`toggle-bg-${this.blockId}`);
    
    // Actualizar clases de botones
    if (btnTradicional) {
      if (plan === 'tradicional') {
        btnTradicional.classList.add('active');
        btnTradicional.classList.remove('inactive');
      } else {
        btnTradicional.classList.add('inactive');
        btnTradicional.classList.remove('active');
      }
    }
    if (btnFijo) {
      if (plan === 'fijo') {
        btnFijo.classList.add('active');
        btnFijo.classList.remove('inactive');
      } else {
        btnFijo.classList.add('inactive');
        btnFijo.classList.remove('active');
      }
    }
    
    // Mover el fondo del toggle animado usando clases pos-left y pos-right
    if (toggleBg) {
      if (plan === 'tradicional') {
        toggleBg.classList.remove('pos-right');
        toggleBg.classList.add('pos-left');
      } else {
        toggleBg.classList.remove('pos-left');
        toggleBg.classList.add('pos-right');
      }
    }
    
    // Actualizar descripción del plan
    const planDescriptionText = document.getElementById(`plan-description-text-${this.blockId}`);
    const descriptions = {
      'tradicional': 'Tú decides cuándo liquidar el total, pagando solo intereses en cada periodo.',
      'fijo': 'Pagos fijos que incluyen capital e intereses. Terminas de pagar en el plazo elegido.'
    };
    if (planDescriptionText) {
      planDescriptionText.textContent = descriptions[plan];
    }
    
    // Mostrar/ocultar slider según el plan
    const sliderContainer = document.getElementById(`slider-container-${this.blockId}`);
    if (sliderContainer) {
      sliderContainer.style.display = plan === 'fijo' ? 'block' : 'none';
    }
    
    this.loadPlanOptions(plan);
  }

  loadPlanOptions(plan) {
    if (!this.currentLoanData || !this.currentLoanData.line_products) {
      console.warn('No loan data available');
      return;
    }
    
    const productData = this.currentLoanData.line_products.products.find(p => 
      (plan === 'tradicional' && p.product === 'Tradicional') ||
      (plan === 'fijo' && p.product === 'Pagos Fijos')
    );
    
    if (!productData || !productData.frecuencies) {
      console.warn('No product data found for plan:', plan);
      return;
    }
    
    this.log('Loading plan options for:', plan, 'Frequencies:', productData.frecuencies.length);
    
    // Generar botones de frecuencia
    const container = document.getElementById(`frequency-options-${this.blockId}`);
    if (container) {
      container.innerHTML = '';
      
    productData.frecuencies.forEach((freq, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'frequency-btn';
        btn.textContent = freq.frecuency;
        btn.dataset.index = idx;
        btn.onclick = () => {
          // Actualizar activo
          container.querySelectorAll('.frequency-btn').forEach(b => {
            b.classList.remove('active', 'selected');
          });
          btn.classList.add('active', 'selected');
          
          this.selectedFrequency = productData.frecuencies[idx];
          this.log('Selected frequency:', this.selectedFrequency);
      this.updateLoanAmount();
      this.setupTermsSelect(this.selectedFrequency);
    };
        container.appendChild(btn);
      });
      
      // Seleccionar primero por defecto
      if (productData.frecuencies.length > 0) {
        // Simular click para activar y cargar términos
        container.firstChild.click();
      }
    } else {
      console.error('Frequency container not found');
    }
  }

  updateLoanAmount() {
    if (!this.selectedFrequency) return;
    
    // Extraer solo el número del formato "$X,XXX.XX"
    const loanAmount = this.selectedFrequency.formatted_loan.replace(/[^0-9.]/g, '');
    const loanAmountEl = document.getElementById(`loan-amount-${this.blockId}`);
    
    if (loanAmountEl) {
      // Formatear con comas y mostrar sin símbolo $ (el símbolo está en el HTML)
      const formatted = parseFloat(loanAmount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      loanAmountEl.textContent = formatted;
    }
  }

  setupTermsSelect(frequency) {
    if (!frequency || !frequency.terms || frequency.terms.length === 0) return;
    
    const slider = document.getElementById(`terms-slider-${this.blockId}`);
    const valueBadge = document.getElementById(`slider-value-badge-${this.blockId}`);
    const sliderUnit = document.getElementById(`slider-unit-${this.blockId}`);
    
    if (slider) {
      // Configurar slider
      const max = frequency.terms.length - 1;
      slider.min = 0;
      slider.max = max;
      slider.value = 0;
      slider.step = 1;
      
      const updateSlider = (idx) => {
        this.selectedTerm = frequency.terms[idx];
    this.updatePaymentSummary();
    
        // Actualizar badge del slider (número grande + unidad separada)
        if (valueBadge) {
          valueBadge.textContent = this.selectedTerm.term;
        }
        if (sliderUnit) {
          const freqLabel = frequency.frecuency.toLowerCase();
          const isMonthly = freqLabel.includes('mensual');
          sliderUnit.textContent = isMonthly ? 'Meses' : 'Pagos';
        }
        
        // Actualizar progreso del slider
        const percent = max > 0 ? (idx / max) * 100 : 0;
        slider.style.background = `linear-gradient(to right, #059669 0%, #059669 ${percent}%, #f1f5f9 ${percent}%, #f1f5f9 100%)`;
      };
      
      slider.oninput = (e) => {
        updateSlider(parseInt(e.target.value));
      };
      
      slider.onchange = (e) => {
        updateSlider(parseInt(e.target.value));
      };
      
      // Inicializar
      updateSlider(0);
    }
  }

  updatePaymentSummary() {
    if (!this.selectedTerm) return;
    
    // Extraer solo el número del formato "$X,XXX.XX"
    const paymentValue = this.selectedTerm.formatted_payment.replace(/[^0-9.]/g, '');
    const lastPaymentValue = this.selectedTerm.formatted_last_payment.replace(/[^0-9.]/g, '');
    
    // Actualizar valores (solo números, sin símbolo $)
    const paymentValueEl = document.getElementById(`payment-value-${this.blockId}`);
    const lastPaymentValueEl = document.getElementById(`last-payment-value-${this.blockId}`);
    
    if (paymentValueEl) {
      paymentValueEl.textContent = parseFloat(paymentValue).toFixed(0);
    }
    if (lastPaymentValueEl) {
      lastPaymentValueEl.textContent = parseFloat(lastPaymentValue).toFixed(0);
    }
    
    // Actualizar etiquetas según el plan y frecuencia
    const periodicLabel = document.getElementById(`periodic-label-${this.blockId}`);
    const finalLabel = document.getElementById(`final-label-${this.blockId}`);
    const finalCard = document.getElementById(`final-card-${this.blockId}`);
    const finalBar = finalCard ? finalCard.querySelector('.loan-card-bar') : null;
    const finalSymbol = document.getElementById(`final-symbol-${this.blockId}`);
    const finalValue = document.getElementById(`last-payment-value-${this.blockId}`);
    
    if (periodicLabel && this.selectedFrequency) {
      const freqLower = this.selectedFrequency.frecuency.toLowerCase();
      periodicLabel.textContent = `Pago ${freqLower}`;
    }
    
    // Estilo diferente para plan tradicional (liquidación final en amber)
    if (this.selectedPlan === 'tradicional') {
      if (finalCard) {
        finalCard.classList.add('amber');
      }
      if (finalLabel) {
        finalLabel.classList.add('amber-text');
      }
      if (finalSymbol) {
        finalSymbol.classList.add('amber-text');
      }
      if (finalValue) {
        finalValue.classList.add('amber-text');
      }
    } else {
      if (finalCard) {
        finalCard.classList.remove('amber');
      }
      if (finalLabel) {
        finalLabel.classList.remove('amber-text');
      }
      if (finalSymbol) {
        finalSymbol.classList.remove('amber-text');
      }
      if (finalValue) {
        finalValue.classList.remove('amber-text');
      }
    }
  }

  showPaymentDetails() {
    if (!this.selectedFrequency || !this.selectedFrequency.terms) return;
    
    const modal = document.getElementById(`modal-${this.blockId}`);
    const modalBody = document.getElementById(`modal-body-${this.blockId}`);
    
    let html = '<h4>Todos los términos disponibles</h4>';
    html += '<table><thead><tr><th>Término</th><th style="text-align: right;">Pago</th><th style="text-align: right;">Último Pago</th></tr></thead><tbody>';
    
    this.selectedFrequency.terms.forEach(term => {
      html += `<tr><td>${term.formatted_term}</td><td style="text-align: right;">${term.formatted_payment}</td><td style="text-align: right;">${term.formatted_last_payment}</td></tr>`;
    });
    
    html += '</tbody></table>';
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
  }

  closeModal() {
    document.getElementById(`modal-${this.blockId}`).style.display = 'none';
  }

  async showContactForm() {
    this.log('showContactForm llamado');
    this.log('selectedPlan:', this.selectedPlan);
    this.log('selectedFrequency:', this.selectedFrequency);
    this.log('selectedTerm:', this.selectedTerm);
    this.log('currentProduct:', this.currentProduct);
    
    // Verificar datos necesarios
    if (!this.selectedFrequency || !this.selectedTerm) {
      console.error('Faltan datos del préstamo');
      alert('Error: Faltan datos del préstamo. Por favor, completa la selección.');
      return;
    }
    
    // Ocultar paneles de préstamo
    const mainPanels = document.getElementById(`main-panels-${this.blockId}`);
    const catalogNav = document.getElementById(`catalog-nav-${this.blockId}`);
    if (mainPanels) mainPanels.style.display = 'none';
    if (catalogNav) catalogNav.style.display = 'none';
    
    // Mostrar sección de selección de sucursal y cita
    const appointmentSection = document.getElementById(`appointment-section-${this.blockId}`);
    if (appointmentSection) {
      appointmentSection.style.display = 'block';
      
      // No hacer scroll automático - mantener posición actual
      
      // Cargar sucursales si no están cargadas
      await this.loadBranches();
      
      // Configurar fecha mínima (hoy) y validación de domingos
      const dateInput = document.getElementById(`appointment-date-${this.blockId}`);
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        
        // Validar que no sea domingo
        dateInput.addEventListener('input', (e) => {
          const selectedDate = new Date(e.target.value + 'T00:00:00');
          const dayOfWeek = selectedDate.getDay();
          
          // 0 = Domingo
          if (dayOfWeek === 0) {
            alert('No se pueden agendar citas los domingos. Por favor selecciona otro día.');
            e.target.value = '';
            return;
          }
          
          this.log('✅ Fecha seleccionada válida:', e.target.value, 'Día:', dayOfWeek);
        });
      }
      
      // Configurar botón continuar
      const btnContinue = document.getElementById(`btn-continue-appointment-${this.blockId}`);
      if (btnContinue) {
        btnContinue.onclick = () => this.showContactFormStep2();
      }
    } else {
      // Si no hay sección de cita, mostrar directamente el formulario de contacto
      this.showContactFormStep2();
    }
  }

  async loadBranches() {
    const select = document.getElementById(`branch-select-${this.blockId}`);
    if (!select) return;
    
    try {
      const response = await fetch('/apps/cotizador/branches');
      if (!response.ok) {
        throw new Error('Error cargando sucursales');
      }
      
      const branches = await response.json();
      
      if (branches.length > 0) {
        select.innerHTML = '<option value="">Selecciona una sucursal</option>';
        branches.forEach(branch => {
          const option = document.createElement('option');
          option.value = branch.ID_SUC || branch.id_suc || '';
          const branchName = branch['NOMBRE DE SUCURSAL'] || branch.nombre_sucursal || branch.name || 'Sucursal';
          const estado = branch.ESTADO || branch.estado || '';
          option.textContent = `${branchName}${estado ? ' - ' + estado : ''}`;
          select.appendChild(option);
        });
      } else {
        select.innerHTML = '<option value="">No hay sucursales disponibles</option>';
      }
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      select.innerHTML = '<option value="">Error cargando sucursales</option>';
    }
  }

  showContactFormStep2() {
    // Validar selección de sucursal y cita
    const branchId = document.getElementById(`branch-select-${this.blockId}`)?.value;
    const appointmentDate = document.getElementById(`appointment-date-${this.blockId}`)?.value;
    const appointmentTime = document.getElementById(`appointment-time-${this.blockId}`)?.value;
    
    if (!branchId || !appointmentDate || !appointmentTime) {
      alert('Por favor completa todos los campos de sucursal y cita');
      return;
    }
    
    // Guardar datos temporalmente
    this.selectedBranchId = branchId;
    this.selectedAppointmentDate = appointmentDate;
    this.selectedAppointmentTime = appointmentTime;
    
    // Ocultar sección de cita y mostrar formulario de contacto
    const appointmentSection = document.getElementById(`appointment-section-${this.blockId}`);
    const formSection = document.getElementById(`form-section-${this.blockId}`);
    
    if (appointmentSection) appointmentSection.style.display = 'none';
    
    if (formSection) {
      // Llenar datos del formulario
      const selectedProductsData = document.getElementById(`selected-products-data-${this.blockId}`);
      const selectedLoanData = document.getElementById(`selected-loan-data-${this.blockId}`);
      
      if (selectedProductsData && this.currentProduct) {
        selectedProductsData.value = JSON.stringify([this.currentProduct]);
      }
      
      if (selectedLoanData) {
        selectedLoanData.value = JSON.stringify({
          product: this.currentProduct?.name || 'Producto Desconocido',
      plan: this.selectedPlan,
      frequency: this.selectedFrequency.frecuency,
      term: this.selectedTerm,
          loan_amount: this.selectedFrequency.loan,
          formatted_loan: this.selectedFrequency.formatted_loan,
          formatted_payment: this.selectedTerm.formatted_payment,
          formatted_last_payment: this.selectedTerm.formatted_last_payment
    });
      }
    
    formSection.style.display = 'block';
    
    // No hacer scroll automático - mantener posición actual
    } else {
      console.error('No se encontró el formulario de contacto');
      alert('Error: No se encontró el formulario de contacto. Por favor, recarga la página e intenta de nuevo.');
    }
  }

  resetSimulation() {
    document.getElementById(`main-panels-${this.blockId}`).style.display = 'none';
    document.getElementById(`form-section-${this.blockId}`).style.display = 'none';
    this.catalogPath = [];
    this.currentProduct = null;
    this.currentLoanData = null;
    this.updateDetailsPanel();
    document.querySelectorAll(`#categories-${this.blockId} .category-item`).forEach(btn => btn.classList.remove('active'));
  }

  resetAll() {
    this.resetSimulation();
    this.currentCategory = null;
    
    // Limpiar campos de sucursal y cita
    this.selectedBranchId = null;
    this.selectedAppointmentDate = null;
    this.selectedAppointmentTime = null;
    
    // Ocultar panel de éxito
    const successPanel = document.getElementById(`success-panel-${this.blockId}`);
    if (successPanel) {
      successPanel.style.display = 'none';
    }
    
    // Ocultar sección de cita
    const appointmentSection = document.getElementById(`appointment-section-${this.blockId}`);
    if (appointmentSection) {
      appointmentSection.style.display = 'none';
    }
    
    // Resetear formulario si existe
    const form = document.getElementById(`cotizador-form-${this.blockId}`);
    if (form) {
      form.reset();
    }
    
    // Resetear campos de cita
    const branchSelect = document.getElementById(`branch-select-${this.blockId}`);
    const appointmentDate = document.getElementById(`appointment-date-${this.blockId}`);
    const appointmentTime = document.getElementById(`appointment-time-${this.blockId}`);
    if (branchSelect) branchSelect.value = '';
    if (appointmentDate) appointmentDate.value = '';
    if (appointmentTime) appointmentTime.value = '';
    
    // Ocultar mensajes
    const messageDiv = document.getElementById(`cotizador-message-${this.blockId}`);
    if (messageDiv) {
      messageDiv.style.display = 'none';
    }
    
    // Mostrar título y descripción nuevamente
    const header = document.querySelector(`#cotizador-${this.blockId} .cotizador-header`);
    if (header) {
      header.style.display = 'flex';
    }
    
    // Mostrar categorías y resetear navegación
    const catalogNav = document.getElementById(`catalog-nav-${this.blockId}`);
    const categories = document.getElementById(`categories-${this.blockId}`);
    
    if (catalogNav) catalogNav.style.display = 'none';
    if (categories) {
      categories.style.display = 'grid';
      
      // No hacer scroll automático - mantener posición actual
    }
    
    this.updateDetailsPanel();
  }

  // MÉTODO DUPLICADO ELIMINADO - Se usa la versión de la línea 674
  // Esta versión antigua buscaba details-panel-${this.blockId} pero el HTML usa details-content-${this.blockId}

  goToStep(stepIndex) {
    // stepIndex 0 = categoría seleccionada (no está en catalogPath)
    // stepIndex 1 = primer item en catalogPath (subcategory_miscellaneous) - mostrar dropdown del paso 1
    // stepIndex 2 = segundo item en catalogPath (brand_catalog) - mostrar dropdown del paso 2
    // etc.
    
    // Si el paso es 0, regresar a la selección de categoría
    if (stepIndex === 0) {
      this.resetCatalog();
      return;
    }
    
    // Calcular cuántos items del path mantener (mantener hasta el paso anterior al seleccionado)
    // stepIndex 1 = mantener 0 items (mostrar dropdown del paso 1)
    // stepIndex 2 = mantener 1 item (mostrar dropdown del paso 2)
    // stepIndex 3 = mantener 2 items (mostrar dropdown del paso 3)
    const itemsToKeep = stepIndex - 1;
    
    // Si el paso seleccionado es mayor que los pasos completados, no hacer nada
    const completedSteps = (this.currentCategory ? 1 : 0) + this.catalogPath.length;
    if (stepIndex > completedSteps) {
      return;
    }
    
    // Si el paso seleccionado es el último completado, no hacer nada (ya está en ese paso)
    if (stepIndex === completedSteps) {
      return;
    }
    
    // Truncar catalogPath hasta el índice correspondiente (mantener items hasta el paso anterior)
    this.catalogPath = this.catalogPath.slice(0, itemsToKeep);
    
    // Mostrar loader visualmente para indicar que se está procesando
    const loadingDiv = document.getElementById(`loading-${this.blockId}`);
    const dropdownsContainer = document.getElementById(`catalog-dropdowns-${this.blockId}`);
    
    if (loadingDiv) {
      // Preservar altura si es posible antes de ocultar los dropdowns
      if (dropdownsContainer && dropdownsContainer.offsetHeight > 0) {
        loadingDiv.style.minHeight = dropdownsContainer.offsetHeight + 'px';
      } else {
        loadingDiv.style.minHeight = '150px';
      }
      
      // FORZAR mostrar loader con !important - centrado
      loadingDiv.style.setProperty('display', 'flex', 'important');
      loadingDiv.style.setProperty('visibility', 'visible', 'important');
      loadingDiv.style.setProperty('opacity', '1', 'important');
      loadingDiv.style.setProperty('flex-direction', 'column', 'important');
      loadingDiv.style.setProperty('align-items', 'center', 'important');
      loadingDiv.style.setProperty('justify-content', 'center', 'important');
      loadingDiv.style.setProperty('z-index', '100', 'important');
      loadingDiv.style.setProperty('background', 'transparent', 'important');
      
      // Ocultar skeleton si existe
      const skeleton = loadingDiv.querySelector('.skeleton-loader');
      if (skeleton) {
        skeleton.style.setProperty('display', 'none', 'important');
      }
      
      // Mostrar solo spinner y asegurar que sea grande
      const spinner = loadingDiv.querySelector('.spinner-loader');
      if (spinner) {
        spinner.style.setProperty('display', 'flex', 'important');
        spinner.style.setProperty('visibility', 'visible', 'important');
        spinner.style.setProperty('opacity', '1', 'important');
        
        // Asegurar que el spinner interno sea grande
        const spinnerElement = spinner.querySelector('.spinner');
        if (spinnerElement) {
          spinnerElement.style.setProperty('width', '56px', 'important');
          spinnerElement.style.setProperty('height', '56px', 'important');
          spinnerElement.style.setProperty('min-width', '56px', 'important');
          spinnerElement.style.setProperty('min-height', '56px', 'important');
          spinnerElement.style.setProperty('border-width', '4px', 'important');
        }
      }
      
      // Forzar reflow
      loadingDiv.offsetHeight;
    }
    
    // Limpiar dropdowns existentes antes de recargar
    if (dropdownsContainer) {
      dropdownsContainer.innerHTML = '';
      dropdownsContainer.style.display = 'none';
      dropdownsContainer.style.visibility = 'hidden';
      dropdownsContainer.style.opacity = '0';
    }
    
    // Determinar qué catálogo cargar para mostrar el dropdown del paso seleccionado
    if (this.catalogPath.length === 0) {
      // Si no hay items en el path, cargar el primer catálogo de la categoría (paso 1)
      const catalogIds = {
        'metals': 'metal_gold_catalog',
        'watches': 'metal_gold_catalog',
        'diamonds': 'diamond_color_catalog',
        'electronics': 'subcategory_miscellaneous',
        'celulares': 'subcategory_miscellaneous',
        'laptops': 'subcategory_miscellaneous',
        'tablets': 'subcategory_miscellaneous',
        'smartwatch': 'subcategory_miscellaneous',
        'consoles': 'subcategory_miscellaneous',
        'others': 'subcategory_miscellaneous',
        'vehicles': 'subcategory_vehicles',
        'auto_financing': 'subcategory_vehicles'
      };
      
      const catalogId = catalogIds[this.currentCategory];
      if (catalogId) {
        this.loadCatalog(catalogId, {});
      }
    } else {
      // Obtener el último item del path truncado y cargar el siguiente catálogo (que corresponde al paso seleccionado)
      const lastItem = this.catalogPath[this.catalogPath.length - 1];
      const nextCatalog = this.getNextCatalog(lastItem.catalogId, lastItem);
      
      if (nextCatalog) {
        this.loadCatalog(nextCatalog.catalogId, nextCatalog.params);
      } else {
        // Si no hay siguiente catálogo, actualizar solo el panel y ocultar loader
        this.updateDetailsPanel();
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        // Si llegamos al final del flujo, calcular resultados
        this.calculateAndShowResults();
      }
    }
    
    // Actualizar el panel de detalles después de truncar el path
    this.updateDetailsPanel();
  }

  updateBreadcrumb() {
    // Breadcrumb removido - ya no se muestra
    // El breadcrumb ha sido ocultado en el HTML y este método ya no se usa
    return;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById(`cotizador-message-${this.blockId}`);
    const originalText = button ? button.textContent : 'Enviar Solicitud';
    
    if (button) {
    button.disabled = true;
    button.textContent = 'Enviando...';
    }

    const formData = new FormData(e.target);
    formData.append('shop', this.config.shop);
    formData.append('source', 'storefront');
    
    // Agregar datos de sucursal y cita
    if (this.selectedBranchId) {
      formData.append('branchId', this.selectedBranchId);
    }
    if (this.selectedAppointmentDate) {
      formData.append('appointmentDate', this.selectedAppointmentDate);
    }
    if (this.selectedAppointmentTime) {
      formData.append('appointmentTime', this.selectedAppointmentTime);
    }

    try {
      const response = await fetch('/apps/cotizador', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Ocultar secciones anteriores
        const formSection = document.getElementById(`form-section-${this.blockId}`);
        const mainPanels = document.getElementById(`main-panels-${this.blockId}`);
        const catalogNav = document.getElementById(`catalog-nav-${this.blockId}`);
        const categories = document.getElementById(`categories-${this.blockId}`);
        
        if (formSection) formSection.style.display = 'none';
        if (mainPanels) mainPanels.style.display = 'none';
        if (catalogNav) catalogNav.style.display = 'none';
        if (categories) categories.style.display = 'none';
        
        // Mostrar panel de éxito
        const successQuoteId = document.getElementById(`success-quote-id-${this.blockId}`);
        const successPanel = document.getElementById(`success-panel-${this.blockId}`);
        
        if (successQuoteId) {
          successQuoteId.textContent = result.quoteNumber || 'PENDIENTE';
        }
        
        if (successPanel) {
        successPanel.style.display = 'block';
        
        // No hacer scroll automático - mantener posición actual
          
          // Configurar el botón de reset en el panel de éxito
          const resetBtn = document.getElementById(`btn-reset-${this.blockId}`);
          if (resetBtn) {
            // Remover listeners anteriores si existen
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            newResetBtn.addEventListener('click', () => {
              this.resetAll();
            });
          }
        } else {
          // Si no hay panel de éxito, mostrar mensaje en el formulario
          if (messageDiv) {
            messageDiv.className = 'cotizador-message-v2 success';
            messageDiv.textContent = `¡Éxito! Cotización enviada. Número: ${result.quoteNumber || 'PENDIENTE'}`;
            messageDiv.style.display = 'block';
          } else {
            alert(`¡Cotización enviada exitosamente!\n\nNúmero de cotización: ${result.quoteNumber || 'PENDIENTE'}\n\nTe contactaremos pronto.`);
          }
        }
        
        // Limpiar formulario
        e.target.reset();
      } else {
        throw new Error(result.error || 'Error al enviar');
      }
    } catch (error) {
      console.error("Error enviando cotización:", error);
      
      if (messageDiv) {
      messageDiv.className = 'cotizador-message-v2 error';
        messageDiv.textContent = `Error: No se pudo enviar. Por favor intenta de nuevo.\n${error.message || ''}`;
      messageDiv.style.display = 'block';
      } else {
        alert(`Error: No se pudo enviar la cotización.\n\n${error.message || 'Por favor intenta de nuevo.'}`);
      }
    } finally {
      if (button) {
      button.disabled = false;
      button.textContent = originalText;
      }
    }
  }
}

// Exportar la clase para que el Liquid pueda inicializarla
// No auto-inicializar aquí
