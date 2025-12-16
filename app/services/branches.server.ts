/**
 * Servicio para cargar sucursales desde el CSV
 * Solo se ejecuta en el servidor
 */

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadBranchesFromCSV() {
  try {
    // Leer el CSV desde public/dim_sucursales.csv
    const csvPath = path.join(process.cwd(), "public", "dim_sucursales.csv");
    console.log("📂 [Branches] Leyendo CSV desde:", csvPath);
    
    let csvContent = readFileSync(csvPath, "utf-8");
    
    // Remover BOM (Byte Order Mark) si existe
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }
    
    // Parsear CSV
    const branches = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Manejar BOM automáticamente
    });
    
    console.log(`✅ [Branches] ${branches.length} sucursales encontradas`);
    
    // Filtrar solo sucursales con ID_SUC válido y estado
    const activeBranches = branches.filter((b: any) => {
      const idSuc = b.ID_SUC || b.id_suc || "";
      const estado = b.ESTADO || b.estado || "";
      return idSuc && idSuc.trim() !== "" && estado && estado.trim() !== "";
    });
    
    console.log(`✅ [Branches] ${activeBranches.length} sucursales activas`);
    
    // Agrupar por estado
    const branchesByState: Record<string, any[]> = {};
    const states: string[] = [];
    
    activeBranches.forEach((branch: any) => {
      const estado = (branch.ESTADO || branch.estado || 'Sin Estado').trim();
      
      if (!branchesByState[estado]) {
        branchesByState[estado] = [];
        states.push(estado);
      }
      
      branchesByState[estado].push({
        id: branch.ID_SUC || branch.id_suc,
        name: branch['NOMBRE DE SUCURSAL'] || branch.nombre_de_sucursal || branch.nombre,
        address: branch['DOMICILIO COMERCIAL CASA DE EMPEÑO'] || branch.domicilio || '',
        email: branch['CORREO SUCURSAL'] || branch.correo || '',
        phone: branch['TEL SUC'] || branch.tel || '',
        estado: estado
      });
    });
    
    // Ordenar estados alfabéticamente
    states.sort();
    
    return {
      states: states,
      branchesByState: branchesByState,
      allBranches: activeBranches.map((b: any) => ({
        id: b.ID_SUC || b.id_suc,
        name: b['NOMBRE DE SUCURSAL'] || b.nombre_de_sucursal || b.nombre,
        address: b['DOMICILIO COMERCIAL CASA DE EMPEÑO'] || b.domicilio || '',
        email: b['CORREO SUCURSAL'] || b.correo || '',
        phone: b['TEL SUC'] || b.tel || '',
        estado: (b.ESTADO || b.estado || 'Sin Estado').trim()
      }))
    };
  } catch (error) {
    console.error("❌ [Branches] Error cargando sucursales:", error);
    throw error;
  }
}


