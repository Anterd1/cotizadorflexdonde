import { useState, useEffect } from "react";
import React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, redirect, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { saveQuote } from "../services/metaobjects.server";
import { searchProducts } from "../services/external-api.server";
import { externalProductToQuoteItem } from "../utils/product-utils";
import type { QuoteItem, CreateQuoteInput } from "../types/quote.types";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Componente de Icono de Categoría
const CategoryIcon = ({ type }: { type: string }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(`/icons/icon-${type}.png`);
  const iconSize = 90.7879;
  
  // Mapa de emojis como fallback
  const emojiMap: Record<string, string> = {
    alhajas: "💍",
    relojes: "⌚",
    celulares: "📱",
    laptops: "💻",
    "autos-motos": "🚗",
    tablets: "📟",
    smartwatch: "⌚",
    consolas: "🎮",
    otros: "🎹",
    "financiamiento-auto": "💰"
  };
  
  const containerStyle: React.CSSProperties = { 
    width: `${iconSize}px`, 
    height: `${iconSize}px`, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    marginBottom: "var(--spacing-md)"
  };
  
  // No usar useEffect para preload, dejar que el img tag maneje el error
  
  if (imageError) {
    return (
      <div style={containerStyle}>
        <span style={{ fontSize: "64px", lineHeight: "1" }}>{emojiMap[type] || "📦"}</span>
      </div>
    );
  }
  
  // Intentar múltiples rutas posibles
  const iconPaths = [
    `/icons/icon-${type}.png`,  // Ruta de la API que creamos
    `/public/icons/icon-${type}.png`,  // Ruta directa de public
  ];
  
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const currentIconPath = iconPaths[currentPathIndex];
  
  return (
    <div style={containerStyle}>
      <img 
        src={currentIconPath}
        alt={type}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          console.error(`❌ Failed to load icon from: ${currentIconPath}`);
          
          // Intentar siguiente ruta
          if (currentPathIndex < iconPaths.length - 1) {
            console.log(`🔄 Trying next path: ${iconPaths[currentPathIndex + 1]}`);
            setCurrentPathIndex(currentPathIndex + 1);
          } else {
            // Si todas las rutas fallan, mostrar emoji
            console.log(`❌ All paths failed, showing emoji fallback`);
            setImageError(true);
          }
        }}
        onLoad={() => {
          console.log(`✅ Icon loaded successfully from: ${currentIconPath}`);
        }}
      />
    </div>
  );
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("📄 [New Quote Loader] Cargando página de nueva cotización...");
  try {
    await authenticate.admin(request);
    console.log("✅ [New Quote Loader] Autenticación exitosa");
    return null;
  } catch (error) {
    console.error("❌ [New Quote Loader] Error en loader:", error);
    throw error;
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "search") {
    const searchTerm = formData.get("search") as string;
    try {
      const products = await searchProducts(searchTerm || undefined);
      return { products, searchTerm };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Error buscando productos",
      };
    }
  }

  if (intent === "load-catalog") {
    const catalogId = formData.get("catalogId") as string;
    const catalogType = formData.get("catalogType") as string;
    try {
      // Construir URL del endpoint de catálogos
      const baseUrl = new URL(request.url);
      const catalogUrl = new URL("/app/catalog", `${baseUrl.protocol}//${baseUrl.host}`);
      catalogUrl.searchParams.append("catalog_id", catalogId);
      catalogUrl.searchParams.append("type", catalogType);
      
      // Agregar parámetros adicionales si existen
      const id_pledge_lakin = formData.get("id_pledge_lakin") as string;
      const brand_id = formData.get("brand_id") as string;
      const model_id = formData.get("model_id") as string;
      const charat1_id = formData.get("charat1_id") as string;
      const charat2_id = formData.get("charat2_id") as string;
      const vehicle_type = formData.get("vehicle_type") as string;
      const year = formData.get("year") as string;
      const brand = formData.get("brand") as string;
      const model = formData.get("model") as string;

      if (id_pledge_lakin) catalogUrl.searchParams.append("id_pledge_lakin", id_pledge_lakin);
      if (brand_id) catalogUrl.searchParams.append("brand_id", brand_id);
      if (model_id) catalogUrl.searchParams.append("model_id", model_id);
      if (charat1_id) catalogUrl.searchParams.append("charat1_id", charat1_id);
      if (charat2_id) catalogUrl.searchParams.append("charat2_id", charat2_id);
      if (vehicle_type) catalogUrl.searchParams.append("vehicle_type", vehicle_type);
      if (year) catalogUrl.searchParams.append("year", year);
      if (brand) catalogUrl.searchParams.append("brand", brand);
      if (model) catalogUrl.searchParams.append("model", model);

      const catalogResponse = await fetch(catalogUrl.toString(), {
        headers: {
          Cookie: request.headers.get("Cookie") || "",
        },
      });

      if (!catalogResponse.ok) {
        const errorText = await catalogResponse.text();
        throw new Error(`Error obteniendo catálogo: ${catalogResponse.statusText} - ${errorText}`);
      }

      const catalog = await catalogResponse.json();
      return { catalog, catalogId };
    } catch (error) {
      console.error("Error cargando catálogo:", error);
      return {
        error: error instanceof Error ? error.message : "Error cargando catálogo",
      };
    }
  }

  if (intent === "get-price") {
    const categoryId = formData.get("categoryId") as string;
    const pledgeId = formData.get("pledgeId") as string;
    const priceParams = formData.get("priceParams") as string;
    try {
      const params = JSON.parse(priceParams || "{}");
      const baseUrl = new URL(request.url);
      const priceUrl = new URL("/app/price", `${baseUrl.protocol}//${baseUrl.host}`);
      priceUrl.searchParams.append("action", "price");
      priceUrl.searchParams.append("category_id", categoryId);
      priceUrl.searchParams.append("pledge_id", pledgeId);
      
      // Agregar parámetros según la categoría
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          priceUrl.searchParams.append(key, String(params[key]));
        }
      });

      const priceResponse = await fetch(priceUrl.toString(), {
        headers: {
          Cookie: request.headers.get("Cookie") || "",
        },
      });

      if (!priceResponse.ok) {
        const errorText = await priceResponse.text();
        throw new Error(`Error obteniendo precio: ${priceResponse.statusText} - ${errorText}`);
      }

      const priceData = await priceResponse.json();
      return { price: priceData.price };
    } catch (error) {
      console.error("Error obteniendo precio:", error);
      return {
        error: error instanceof Error ? error.message : "Error obteniendo precio",
      };
    }
  }

  if (intent === "create") {
    try {
      console.log("📝 [New Quote] Creando cotización desde app embebida");
      
      const customerName = formData.get("customerName") as string;
      const customerEmail = formData.get("customerEmail") as string;
      const customerPhone = formData.get("customerPhone") as string;
      const notes = formData.get("notes") as string;
      const itemsJson = formData.get("items") as string;
      
      // Valores por defecto para sucursal (pueden venir del contexto de la tienda)
      const branchName = "Sucursal Principal"; // O obtener de configuración
      const branchEmail = customerEmail; // O obtener de configuración

      console.log("📋 [New Quote] Datos recibidos:", {
        customerName,
        customerEmail,
        branchName,
        branchEmail,
        itemsJson: itemsJson?.substring(0, 100),
      });

      const items: QuoteItem[] = JSON.parse(itemsJson || "[]");
      console.log(`📦 [New Quote] Artículos parseados: ${items.length}`);

      // Permitir cotizaciones sin artículos (como en el storefront)
      // El admin puede agregar artículos después editando la cotización
      if (items.length === 0) {
        console.warn("⚠️ [New Quote] Cotización sin artículos - permitida (se puede agregar después)");
      }

      const quoteData: CreateQuoteInput = {
        customerName,
        customerEmail,
        customerPhone: customerPhone || undefined,
        branchName,
        branchEmail,
        items,
        notes: notes || undefined,
        validUntilDays: 30,
      };

      // Calcular totales
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = 0; // Por ahora sin impuestos
      const discount = 0; // Por ahora sin descuentos
      const total = subtotal + tax - discount;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (quoteData.validUntilDays || 30));

      console.log("💾 [New Quote] Intentando guardar cotización...");
      const quote = await saveQuote(admin, shopId, {
        ...quoteData,
        status: "draft",
        subtotal,
        tax,
        discount,
        total,
        validUntil: validUntil.toISOString(),
      });

      console.log(`✅ [New Quote] Cotización creada exitosamente: ${quote.quoteNumber}`);
      console.log(`✅ [New Quote] Quote ID: ${quote.id}`);

      return redirect(`/app/quotes/${quote.id}`);
    } catch (error) {
      console.error("❌ [New Quote] Error creando cotización:", error);
      console.error("❌ [New Quote] Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("❌ [New Quote] Error message:", error instanceof Error ? error.message : String(error));
      console.error("❌ [New Quote] Error stack:", error instanceof Error ? error.stack : "No stack available");
      
      return {
        error: error instanceof Error ? error.message : "Error creando cotización",
      };
    }
  }

  return { error: "Acción no válida" };
};

export default function NewQuote() {
  console.log("🎨 [New Quote Component] INICIO - Renderizando componente...");
  
  console.log("🎨 [New Quote Component] Paso 1: Inicializando fetcher...");
  const fetcher = useFetcher<typeof action>();
  console.log("✅ [New Quote Component] Fetcher inicializado");
  
  console.log("🎨 [New Quote Component] Paso 2: Inicializando AppBridge...");
  const shopify = useAppBridge();
  console.log("✅ [New Quote Component] AppBridge inicializado:", shopify);
  
  console.log("🎨 [New Quote Component] Paso 3: Inicializando estados...");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "catalog">("search");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [catalogData, setCatalogData] = useState<any>(null);
  const [selectedCatalogPath, setSelectedCatalogPath] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<number, any>>({});
  const [updatingPriceIndex, setUpdatingPriceIndex] = useState<number | null>(null);
  console.log("✅ [New Quote Component] Estados inicializados");
  
  useEffect(() => {
    console.log("🎨 [New Quote Component] Componente montado completamente");
    console.log("🎨 [New Quote Component] Shop:", shopify);
  }, [shopify]);

  useEffect(() => {
    if (fetcher.data?.products) {
      setProducts(fetcher.data.products);
    }
    if (fetcher.data?.catalog) {
      setCatalogData(fetcher.data.catalog);
      setLoadingCatalog(false);
    }
    if (fetcher.data?.price) {
      // Verificar si es una actualización de precio o un nuevo producto
      const lastPath = selectedCatalogPath[selectedCatalogPath.length - 1];
      
      if (lastPath && selectedCatalogPath.length > 0) {
        // Es un nuevo producto
        const newItemIndex = items.length;
        const productDetail = {
          category: selectedCategory,
          path: selectedCatalogPath,
          price: fetcher.data.price,
          catalogId: lastPath.catalogId,
        };
        setProductDetails({ ...productDetails, [newItemIndex]: productDetail });
        
        const quoteItem: QuoteItem = {
          externalProductId: lastPath.id || "",
          productCode: lastPath.name || "",
          productName: `${selectedCategory}: ${lastPath.name}`,
          description: lastPath.description || "",
          quantity: 1,
          unitPrice: fetcher.data.price,
          totalPrice: fetcher.data.price,
        };
        setItems([...items, quoteItem]);
        setSelectedCatalogPath([]);
        setCatalogData(null);
        setSelectedCategory("");
        if (shopify) {
          shopify.toast.show(`Producto agregado: ${quoteItem.productName} - $${fetcher.data.price.toFixed(2)}`);
        }
      } else if (updatingPriceIndex !== null) {
        // Es una actualización de precio (por ejemplo, cambio de peso en metales)
        const idx = updatingPriceIndex;
        const updatedItems = [...items];
        updatedItems[idx] = {
          ...updatedItems[idx],
          unitPrice: fetcher.data.price,
          totalPrice: fetcher.data.price * updatedItems[idx].quantity,
        };
        setItems(updatedItems);
        
        // Actualizar el precio en los detalles también
        const updatedDetails = { ...productDetails };
        if (updatedDetails[idx]) {
          updatedDetails[idx] = { ...updatedDetails[idx], price: fetcher.data.price };
        }
        setProductDetails(updatedDetails);
        setUpdatingPriceIndex(null);
      }
    }
    if (fetcher.data?.error) {
      console.error("❌ [New Quote UI] Error recibido:", fetcher.data.error);
      setLoadingCatalog(false);
      if (shopify) {
        shopify.toast.show(fetcher.data.error, { isError: true });
      }
    }
    if (fetcher.data && !fetcher.data.error && !fetcher.data.products && !fetcher.data.catalog && !fetcher.data.price) {
      console.log("✅ [New Quote UI] Respuesta exitosa:", fetcher.data);
    }
  }, [fetcher.data, shopify, items, selectedCatalogPath, selectedCategory]);

  const handleSearch = () => {
    fetcher.submit(
      { intent: "search", search: searchTerm },
      { method: "POST" }
    );
  };

  const handleAddItem = (product: any, quantity: number = 1) => {
    const quoteItem = externalProductToQuoteItem(product, quantity);
    setItems([...items, quoteItem]);
    setSearchTerm("");
    setProducts([]);
  };

  const handleLoadCatalog = (catalogId: string, catalogType: "standard" | "ext" = "standard", extraParams: any = {}) => {
    setLoadingCatalog(true);
    const formData = new FormData();
    formData.append("intent", "load-catalog");
    formData.append("catalogId", catalogId);
    formData.append("catalogType", catalogType);
    
    Object.keys(extraParams).forEach(key => {
      if (extraParams[key]) {
        formData.append(key, extraParams[key]);
      }
    });
    
    fetcher.submit(formData, { method: "POST" });
  };

  const handleCatalogItemSelect = (item: any, catalogId: string) => {
    const newPath = [...selectedCatalogPath, { ...item, catalogId }];
    setSelectedCatalogPath(newPath);

    // Determinar el siguiente paso según el catálogo
    if (item.child && item.child !== false) {
      // Hay un siguiente nivel
      if (catalogId === "subcategory_miscellaneous") {
        // Electrónicos: siguiente es brand_catalog
        handleLoadCatalog("brand_catalog", "standard", {
          id_pledge_lakin: item.id_pledge_Lakin || item.id_pledge_lakin,
        });
      } else if (catalogId === "brand_catalog") {
        // Siguiente es model_catalog
        const pledgeId = newPath.find(p => p.id_pledge_Lakin)?.id_pledge_Lakin || 
                        newPath.find(p => p.id_pledge_lakin)?.id_pledge_lakin ||
                        newPath[0]?.child_ids?.find((c: any) => c.name === "id_pledge_lakin")?.value;
        handleLoadCatalog("model_catalog", "standard", {
          id_pledge_lakin: pledgeId,
          brand_id: item.brand_id,
        });
      } else if (catalogId === "model_catalog") {
        // Siguiente es feature_1_catalog
        const pledgeId = newPath[0]?.child_ids?.find((c: any) => c.name === "id_pledge_lakin")?.value;
        handleLoadCatalog("feature_1_catalog", "standard", {
          id_pledge_lakin: pledgeId,
          brand_id: newPath.find(p => p.brand_id)?.brand_id,
          model_id: item.model_id,
        });
      } else if (catalogId === "feature_1_catalog") {
        // Siguiente es feature_2_catalog
        const pledgeId = newPath[0]?.child_ids?.find((c: any) => c.name === "id_pledge_lakin")?.value;
        handleLoadCatalog("feature_2_catalog", "standard", {
          id_pledge_lakin: pledgeId,
          brand_id: newPath.find(p => p.brand_id)?.brand_id || newPath[0]?.child_ids?.find((c: any) => c.name === "brand_id")?.value,
          model_id: newPath.find(p => p.model_id)?.model_id || newPath[0]?.child_ids?.find((c: any) => c.name === "model_id")?.value,
          charat1_id: item.charat1_id,
        });
      } else if (catalogId === "feature_2_catalog") {
        // Siguiente es feature_3_catalog
        const pledgeId = newPath[0]?.child_ids?.find((c: any) => c.name === "id_pledge_lakin")?.value;
        handleLoadCatalog("feature_3_catalog", "standard", {
          id_pledge_lakin: pledgeId,
          brand_id: newPath[0]?.child_ids?.find((c: any) => c.name === "brand_id")?.value,
          model_id: newPath[0]?.child_ids?.find((c: any) => c.name === "model_id")?.value,
          charat1_id: newPath.find(p => p.charat1_id)?.charat1_id,
          charat2_id: item.charat2_id,
        });
      } else if (catalogId === "subcategory_vehicles") {
        // Vehículos: siguiente es year_vehicles
        const vehicleType = item.child_ids?.find((c: any) => c.name === "vehicle_type")?.id;
        handleLoadCatalog("year_vehicles", "ext", {
          vehicle_type: vehicleType,
        });
      } else if (catalogId === "year_vehicles") {
        // Siguiente es brand_vehicles
        const vehicleType = newPath[0]?.child_ids?.find((c: any) => c.name === "vehicle_type")?.id;
        handleLoadCatalog("brand_vehicles", "ext", {
          vehicle_type: vehicleType,
          year: item.id || item.name,
        });
      } else if (catalogId === "brand_vehicles") {
        // Siguiente es model_vehicles
        const vehicleType = newPath[0]?.child_ids?.find((c: any) => c.name === "vehicle_type")?.id;
        handleLoadCatalog("model_vehicles", "ext", {
          vehicle_type: vehicleType,
          year: newPath.find(p => p.catalogId === "year_vehicles")?.id || newPath.find(p => p.catalogId === "year_vehicles")?.name,
          brand: item.id,
        });
      } else if (catalogId === "model_vehicles") {
        // Siguiente es version_vehicles
        const vehicleType = newPath[0]?.child_ids?.find((c: any) => c.name === "vehicle_type")?.id;
        handleLoadCatalog("version_vehicles", "ext", {
          vehicle_type: vehicleType,
          year: newPath.find(p => p.catalogId === "year_vehicles")?.id || newPath.find(p => p.catalogId === "year_vehicles")?.name,
          brand: newPath.find(p => p.catalogId === "brand_vehicles")?.id,
          model: item.id,
        });
      } else if (catalogId === "diamond_color_catalog") {
        // Diamantes: siguiente es diamond_clarity_catalog
        handleLoadCatalog("diamond_clarity_catalog", "standard");
      } else if (catalogId === "diamond_clarity_catalog") {
        // Siguiente es diamond_size_catalog
        handleLoadCatalog("diamond_size_catalog", "standard");
      }
    } else {
      // No hay siguiente nivel, obtener precio y agregar
      handleGetPriceAndAdd(newPath);
    }
  };

  const handleGetPriceAndAdd = async (path: any[]) => {
    // Determinar category_id y pledge_id según el tipo de producto
    let categoryId = 0;
    let pledgeId = 0;
    const priceParams: any = {};

    const firstItem = path[0];
    const catalogId = firstItem.catalogId;

    if (catalogId === "metal_gold_catalog" || catalogId === "metal_silver_catalog") {
      categoryId = 1;
      pledgeId = catalogId === "metal_gold_catalog" ? 4 : 4; // Ambos usan pledge_id 4 para metales
      const selectedMetal = path[path.length - 1];
      // Necesitaríamos el peso, pero por ahora usamos valores por defecto
      priceParams.karat = selectedMetal.karat_id || 14;
      priceParams.weight = 1.0; // Valor por defecto, el usuario debería poder editarlo
    } else if (catalogId === "diamond_color_catalog" || catalogId === "diamond_clarity_catalog" || catalogId === "diamond_size_catalog") {
      categoryId = 1;
      pledgeId = 11;
      const colorItem = path.find(p => p.catalogId === "diamond_color_catalog");
      const clarityItem = path.find(p => p.catalogId === "diamond_clarity_catalog");
      const sizeItem = path.find(p => p.catalogId === "diamond_size_catalog");
      priceParams.amount = 1;
      priceParams.clarity_id = clarityItem?.clarity_id || 1;
      priceParams.colour_id = colorItem?.colour_id || 1;
      priceParams.karats = sizeItem?.karat || 0.1;
      priceParams.karats_id = sizeItem?.karat_id || 1;
      priceParams.old_cut = "0";
    } else if (catalogId === "subcategory_miscellaneous" || catalogId.startsWith("brand_catalog") || catalogId.startsWith("model_catalog") || catalogId.startsWith("feature_")) {
      categoryId = 5;
      const pledgeIdFromPath = path[0]?.id_pledge_Lakin || path[0]?.id_pledge_lakin || path[0]?.child_ids?.find((c: any) => c.name === "id_pledge_lakin")?.value;
      pledgeId = parseInt(pledgeIdFromPath) || 60;
      const brandItem = path.find(p => p.brand_id);
      const modelItem = path.find(p => p.model_id);
      const feature1Item = path.find(p => p.charat1_id);
      const feature2Item = path.find(p => p.charat2_id);
      const feature3Item = path.find(p => p.charat3_id);
      priceParams.brand_id = brandItem?.brand_id || "";
      priceParams.model_id = modelItem?.model_id || "";
      priceParams.feature1_id = feature1Item?.charat1_id || "";
      priceParams.feature2_id = feature2Item?.charat2_id || "";
      priceParams.feature3_id = feature3Item?.charat3_id || "";
    } else if (catalogId === "subcategory_vehicles" || catalogId.startsWith("year_vehicles") || catalogId.startsWith("brand_vehicles") || catalogId.startsWith("model_vehicles") || catalogId.startsWith("version_vehicles")) {
      categoryId = 2; // O 6 para motos
      const vehicleType = path[0]?.child_ids?.find((c: any) => c.name === "vehicle_type")?.id;
      pledgeId = vehicleType === "2" ? 2 : 1; // 2 = Auto Rodando, 1 = Auto Resguardo/Motos
      const yearItem = path.find(p => p.catalogId === "year_vehicles");
      const brandItem = path.find(p => p.catalogId === "brand_vehicles");
      const modelItem = path.find(p => p.catalogId === "model_vehicles");
      const versionItem = path.find(p => p.catalogId === "version_vehicles");
      priceParams.vehicle = path[0]?.child_ids?.find((c: any) => c.name === "vehicle")?.id || "0";
      priceParams.brand_id = brandItem?.id || "";
      priceParams.model_id = modelItem?.id || "";
      priceParams.version_id = versionItem?.id || "";
      priceParams.year = yearItem?.id || yearItem?.name || "";
    }

    if (categoryId && pledgeId) {
      setLoadingCatalog(true);
      const formData = new FormData();
      formData.append("intent", "get-price");
      formData.append("categoryId", String(categoryId));
      formData.append("pledgeId", String(pledgeId));
      formData.append("priceParams", JSON.stringify(priceParams));
      fetcher.submit(formData, { method: "POST" });
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    const newDetails = { ...productDetails };
    delete newDetails[index];
    // Reindexar los detalles
    const reindexed: Record<number, any> = {};
    Object.keys(newDetails).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexed[oldIndex - 1] = newDetails[oldIndex];
      } else if (oldIndex < index) {
        reindexed[oldIndex] = newDetails[oldIndex];
      }
    });
    setProductDetails(reindexed);
  };

  const handleUpdateProductDetail = (index: number, field: string, value: any) => {
    const updatedDetails = {
      ...productDetails,
      [index]: {
        ...productDetails[index],
        [field]: value,
      },
    };
    setProductDetails(updatedDetails);
    
    // Recalcular precio si es necesario
    const detail = updatedDetails[index];
    if (detail && field === "weight") {
      // Recalcular precio para metales cuando cambia el peso
      if (detail.category === "metals") {
        setUpdatingPriceIndex(index);
        const metalItem = detail.path[detail.path.length - 1];
        const formData = new FormData();
        formData.append("intent", "get-price");
        formData.append("categoryId", "1");
        formData.append("pledgeId", "4");
        formData.append("priceParams", JSON.stringify({
          karat: metalItem.karat_id || 14,
          weight: parseFloat(value) || 1.0,
        }));
        fetcher.submit(formData, { method: "POST" });
      }
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].totalPrice = newItems[index].unitPrice * quantity;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("intent", "create");
    formData.append("items", JSON.stringify(items));
    fetcher.submit(formData, { method: "POST" });
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal;

  return (
    <s-page heading="Nueva Cotización">
      <s-section heading="Artículos">
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            {/* Tabs para elegir entre búsqueda y catálogos */}
            <div className="modern-tabs">
              <button
                className={`modern-tab ${activeTab === "search" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("search");
                  setCatalogData(null);
                  setSelectedCatalogPath([]);
                }}
              >
                🔍 Buscar Productos
              </button>
              <button
                className={`modern-tab ${activeTab === "catalog" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("catalog");
                  setProducts([]);
                  setSearchTerm("");
                }}
              >
                📋 Catálogos
              </button>
            </div>

            {/* Búsqueda de productos (existente) */}
            {activeTab === "search" && (
              <s-stack direction="block" gap="base">
                <s-stack direction="inline" gap="base">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="modern-form-input"
                    style={{ flex: 1 }}
                  />
                  <s-button onClick={handleSearch}>Buscar</s-button>
                </s-stack>

                {products.length > 0 && (
                  <s-box padding="base" background="subdued">
                    <s-stack direction="block" gap="base">
                      <s-heading>Resultados de búsqueda</s-heading>
                      {products.map((product) => (
                        <s-box
                          key={product.id}
                          padding="base"
                          borderWidth="base"
                          borderRadius="base"
                        >
                          <s-stack direction="inline" gap="base">
                            <div style={{ flex: 1 }}>
                              <strong>{product.name}</strong>
                              <br />
                              <small>Código: {product.code}</small>
                              <br />
                              <small>Precio: ${product.price.toFixed(2)}</small>
                            </div>
                            <input
                              type="number"
                              min="1"
                              defaultValue="1"
                              style={{ width: "60px", padding: "4px" }}
                              onBlur={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                handleAddItem(product, qty);
                              }}
                            />
                            <s-button
                              onClick={() => handleAddItem(product, 1)}
                              variant="primary"
                            >
                              Agregar
                            </s-button>
                          </s-stack>
                        </s-box>
                      ))}
                    </s-stack>
                  </s-box>
                )}
              </s-stack>
            )}

            {/* Catálogos */}
            {activeTab === "catalog" && (
              <s-stack direction="block" gap="base">
                {selectedCatalogPath.length > 0 && (
                  <div className="breadcrumb-container">
                    {selectedCatalogPath.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div className="breadcrumb-item">
                          {item.name}
                        </div>
                        {idx < selectedCatalogPath.length - 1 && (
                          <span className="breadcrumb-separator">→</span>
                        )}
                      </React.Fragment>
                    ))}
                    <button
                      className="modern-button modern-button-secondary"
                      onClick={() => {
                        setSelectedCatalogPath([]);
                        setCatalogData(null);
                        setSelectedCategory("");
                      }}
                      style={{ marginLeft: "auto", padding: "8px 16px", fontSize: "13px" }}
                    >
                      ↺ Reiniciar
                    </button>
                  </div>
                )}

                {!catalogData && selectedCatalogPath.length === 0 && (
                  <div className="modern-section">
                    <div className="modern-section-header" style={{ textAlign: "center", marginBottom: "48px" }}>
                      <h1 style={{ 
                        fontSize: "32px", 
                        fontWeight: "500", 
                        color: "#005745", 
                        margin: "0 0 8px 0",
                        lineHeight: "34px"
                      }}>
                        Monétiza tus bienes
                      </h1>
                      <p style={{ 
                        fontSize: "16px", 
                        color: "#5e6362", 
                        margin: 0,
                        lineHeight: "18px"
                      }}>
                        Cotiza el valor aproximado de tus artículos en minutos.
                      </p>
                    </div>
                    <div className="categories-grid" style={{ 
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: "37.58px",
                      maxWidth: "100%"
                    }}>
                      {/* Fila 1 */}
                      <div
                        className={`category-card ${selectedCategory === "metals" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("metals");
                          handleLoadCatalog("metal_gold_catalog", "standard");
                        }}
                      >
                        <CategoryIcon type="alhajas" />
                        <h3 className="category-title">Alhajas</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "watches" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("watches");
                          handleLoadCatalog("subcategory_miscellaneous", "standard");
                        }}
                      >
                        <CategoryIcon type="relojes" />
                        <h3 className="category-title">Relojes</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "electronics" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("electronics");
                          handleLoadCatalog("subcategory_miscellaneous", "standard");
                        }}
                      >
                        <CategoryIcon type="celulares" />
                        <h3 className="category-title">Celulares</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "laptops" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("laptops");
                          handleLoadCatalog("subcategory_miscellaneous", "standard");
                        }}
                      >
                        <CategoryIcon type="laptops" />
                        <h3 className="category-title">Laptops</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "vehicles" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("vehicles");
                          handleLoadCatalog("subcategory_vehicles", "ext");
                        }}
                      >
                        <CategoryIcon type="autos-motos" />
                        <h3 className="category-title">Autos y Motos</h3>
                      </div>
                      
                      {/* Fila 2 */}
                      <div
                        className={`category-card ${selectedCategory === "tablets" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("tablets");
                          handleLoadCatalog("subcategory_miscellaneous", "standard");
                        }}
                      >
                        <CategoryIcon type="tablets" />
                        <h3 className="category-title">Tablets</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "smartwatch" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("smartwatch");
                          handleLoadCatalog("subcategory_miscellaneous", "standard");
                        }}
                      >
                        <CategoryIcon type="smartwatch" />
                        <h3 className="category-title">Smartwatch</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "consoles" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("consoles");
                          handleLoadCatalog("subcategory_miscellaneous", "standard");
                        }}
                      >
                        <CategoryIcon type="consolas" />
                        <h3 className="category-title">Consolas</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "others" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("others");
                          handleLoadCatalog("subcategory_miscellaneous", "standard");
                        }}
                      >
                        <CategoryIcon type="otros" />
                        <h3 className="category-title">Otros</h3>
                      </div>
                      <div
                        className={`category-card ${selectedCategory === "auto_financing" ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategory("auto_financing");
                          // Esta categoría podría tener un comportamiento especial
                        }}
                      >
                        <CategoryIcon type="financiamiento-auto" />
                        <h3 className="category-title" style={{ lineHeight: "1.3" }}>
                          Financiamiento<br />para tu auto
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {loadingCatalog && (
                  <div className="empty-state">
                    <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
                    <p style={{ marginTop: "16px" }}>Cargando catálogo...</p>
                  </div>
                )}

                {catalogData && catalogData.catalog && (
                  <div className="modern-section">
                    <div className="modern-section-header">
                      <h2 className="modern-section-title">
                        {catalogData.catalog.catalog_id === "metal_gold_catalog" && "Oro"}
                        {catalogData.catalog.catalog_id === "metal_silver_catalog" && "Plata"}
                        {catalogData.catalog.catalog_id === "diamond_color_catalog" && "Color de Diamante"}
                        {catalogData.catalog.catalog_id === "diamond_clarity_catalog" && "Claridad de Diamante"}
                        {catalogData.catalog.catalog_id === "diamond_size_catalog" && "Tamaño de Diamante"}
                        {catalogData.catalog.catalog_id === "subcategory_miscellaneous" && "Categoría de Electrónico"}
                        {catalogData.catalog.catalog_id === "brand_catalog" && "Marca"}
                        {catalogData.catalog.catalog_id === "model_catalog" && "Modelo"}
                        {catalogData.catalog.catalog_id === "feature_1_catalog" && "Característica 1"}
                        {catalogData.catalog.catalog_id === "feature_2_catalog" && "Característica 2"}
                        {catalogData.catalog.catalog_id === "feature_3_catalog" && "Característica 3"}
                        {catalogData.catalog.catalog_id === "subcategory_vehicles" && "Tipo de Vehículo"}
                        {catalogData.catalog.catalog_id === "year_vehicles" && "Año"}
                        {catalogData.catalog.catalog_id === "brand_vehicles" && "Marca"}
                        {catalogData.catalog.catalog_id === "model_vehicles" && "Modelo"}
                        {catalogData.catalog.catalog_id === "version_vehicles" && "Versión"}
                      </h2>
                    </div>
                    <div>
                      {catalogData.catalog.data.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="catalog-item-card"
                          onClick={() => handleCatalogItemSelect(item, catalogData.catalog.catalog_id)}
                        >
                          <div className="catalog-item-title">{item.name}</div>
                          {item.description && (
                            <div className="catalog-item-description">{item.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </s-stack>
            )}

            {items.length > 0 && (
              <div className="modern-section">
                <div className="modern-section-header">
                  <h2 className="modern-section-title">Artículos en la cotización</h2>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style={{ textAlign: "center" }}>Cantidad</th>
                        <th style={{ textAlign: "right" }}>Precio Unit.</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const detail = productDetails[index];
                      return (
                        <tr key={index}>
                          <td>
                            <div style={{ fontWeight: "600", marginBottom: "4px" }}>{item.productName}</div>
                            <div className="badge badge-primary" style={{ fontSize: "11px", marginTop: "4px" }}>{item.productCode}</div>
                            {detail && (
                              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                {detail.category === "metals" && (
                                  <div>
                                    <label>
                                      Peso (gramos):
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={detail.weight || 1.0}
                                        onChange={(e) => {
                                          handleUpdateProductDetail(index, "weight", e.target.value);
                                        }}
                                        style={{ width: "80px", marginLeft: "4px", padding: "2px" }}
                                      />
                                    </label>
                                  </div>
                                )}
                                {detail.category === "diamonds" && detail.path && (
                                  <div>
                                    {detail.path.find((p: any) => p.catalogId === "diamond_color_catalog") && (
                                      <div>Color: {detail.path.find((p: any) => p.catalogId === "diamond_color_catalog")?.name}</div>
                                    )}
                                    {detail.path.find((p: any) => p.catalogId === "diamond_clarity_catalog") && (
                                      <div>Claridad: {detail.path.find((p: any) => p.catalogId === "diamond_clarity_catalog")?.name}</div>
                                    )}
                                    {detail.path.find((p: any) => p.catalogId === "diamond_size_catalog") && (
                                      <div>Tamaño: {detail.path.find((p: any) => p.catalogId === "diamond_size_catalog")?.name}</div>
                                    )}
                                    <label style={{ display: "block", marginTop: "4px" }}>
                                      Cantidad:
                                      <input
                                        type="number"
                                        min="1"
                                        value={detail.amount || 1}
                                        onChange={(e) => {
                                          handleUpdateProductDetail(index, "amount", parseInt(e.target.value) || 1);
                                        }}
                                        style={{ width: "60px", marginLeft: "4px", padding: "2px" }}
                                      />
                                    </label>
                                  </div>
                                )}
                                {detail.category === "electronics" && detail.path && (
                                  <div>
                                    {detail.path.find((p: any) => p.catalogId === "subcategory_miscellaneous") && (
                                      <div>Categoría: {detail.path.find((p: any) => p.catalogId === "subcategory_miscellaneous")?.name}</div>
                                    )}
                                    {detail.path.find((p: any) => p.brand_id) && (
                                      <div>Marca: {detail.path.find((p: any) => p.brand_id)?.name}</div>
                                    )}
                                    {detail.path.find((p: any) => p.model_id) && (
                                      <div>Modelo: {detail.path.find((p: any) => p.model_id)?.name}</div>
                                    )}
                                    {detail.path.filter((p: any) => p.charat1_id || p.charat2_id || p.charat3_id).map((p: any, idx: number) => (
                                      <div key={idx}>Característica {idx + 1}: {p.name}</div>
                                    ))}
                                  </div>
                                )}
                                {detail.category === "vehicles" && detail.path && (
                                  <div>
                                    {detail.path.find((p: any) => p.catalogId === "subcategory_vehicles") && (
                                      <div>Tipo: {detail.path.find((p: any) => p.catalogId === "subcategory_vehicles")?.name}</div>
                                    )}
                                    {detail.path.find((p: any) => p.catalogId === "year_vehicles") && (
                                      <div>Año: {detail.path.find((p: any) => p.catalogId === "year_vehicles")?.name || detail.path.find((p: any) => p.catalogId === "year_vehicles")?.id}</div>
                                    )}
                                    {detail.path.find((p: any) => p.catalogId === "brand_vehicles") && (
                                      <div>Marca: {detail.path.find((p: any) => p.catalogId === "brand_vehicles")?.name}</div>
                                    )}
                                    {detail.path.find((p: any) => p.catalogId === "model_vehicles") && (
                                      <div>Modelo: {detail.path.find((p: any) => p.catalogId === "model_vehicles")?.name}</div>
                                    )}
                                    {detail.path.find((p: any) => p.catalogId === "version_vehicles") && (
                                      <div>Versión: {detail.path.find((p: any) => p.catalogId === "version_vehicles")?.name}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                              }
                              className="modern-form-input"
                              style={{ width: "70px", textAlign: "center" }}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "600", color: "var(--color-primary)" }}>
                            ${item.totalPrice.toFixed(2)}
                          </td>
                          <td>
                            <button
                              className="modern-button modern-button-secondary"
                              onClick={() => handleRemoveItem(index)}
                              style={{ padding: "6px 12px", fontSize: "13px" }}
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                    <tfoot style={{ background: "var(--bg-subdued)" }}>
                      <tr>
                        <td colSpan={3} style={{ textAlign: "right", fontWeight: "600", fontSize: "16px" }}>
                          Total:
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "700", fontSize: "18px", color: "var(--color-primary)" }}>
                          ${total.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </s-stack>
        </s-box>
      </s-section>

      <div className="modern-section">
        <div className="modern-section-header">
          <h2 className="modern-section-title">Información del Cliente</h2>
          <p className="modern-section-description">Completa los datos del cliente para la cotización</p>
        </div>
        <fetcher.Form method="POST" onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "var(--spacing-lg)" }}>
            <div className="modern-form-group">
              <label className="modern-form-label">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                name="customerName"
                required
                className="modern-form-input"
                placeholder="Ingresa el nombre completo"
              />
            </div>

            <div className="modern-form-group">
              <label className="modern-form-label">
                Email del Cliente *
              </label>
              <input
                type="email"
                name="customerEmail"
                required
                className="modern-form-input"
                placeholder="cliente@ejemplo.com"
              />
            </div>

            <div className="modern-form-group">
              <label className="modern-form-label">
                Teléfono del Cliente
              </label>
              <input
                type="tel"
                name="customerPhone"
                className="modern-form-input"
                placeholder="+52 55 1234 5678"
              />
            </div>

            <div className="modern-form-group">
              <label className="modern-form-label">
                Notas Adicionales
              </label>
              <textarea
                name="notes"
                rows={4}
                className="modern-form-input"
                placeholder="Información adicional sobre la cotización..."
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", gap: "var(--spacing-md)", marginTop: "var(--spacing-md)" }}>
              <button
                type="submit"
                className="modern-button modern-button-primary"
                style={{ minWidth: "200px" }}
              >
                💾 Guardar Cotización
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("❌ [New Quote ErrorBoundary] Error capturado:", error);
  console.error("❌ [New Quote ErrorBoundary] Error type:", error instanceof Error ? error.constructor.name : typeof error);
  console.error("❌ [New Quote ErrorBoundary] Error message:", error instanceof Error ? error.message : String(error));
  console.error("❌ [New Quote ErrorBoundary] Error stack:", error instanceof Error ? error.stack : "No stack");
  return boundary.error(error);
}

