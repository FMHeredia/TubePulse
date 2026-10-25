import * as XLSX from 'xlsx';
import { BenchmarkResult, UserVideo } from '../types';

export function exportToExcel(benchmark: BenchmarkResult, userVideo: UserVideo) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Competitors Top 10
  const compData = benchmark.competitors.map((c) => ({
    '#': c.rank,
    'Título del Video': c.title,
    'Canal': c.channel,
    'Visualizaciones': c.views,
    'Antigüedad (< 1 mes)': c.published,
    'Enlace': c.url,
    'Número de Etiquetas': c.tags.length,
    'Etiquetas Usadas': c.tags.join(', '),
    'Factor Clave de Éxito': c.keySuccessFactor,
    'Resumen Descripción': c.descriptionSummary,
  }));
  const wsCompetitors = XLSX.utils.json_to_sheet(compData);
  XLSX.utils.book_append_sheet(wb, wsCompetitors, 'Top 10 Competidores');

  // Sheet 2: Tag Popularity Matrix
  const tagData = benchmark.tagMatrix.map((t, idx) => ({
    'Ranking': idx + 1,
    'Etiqueta': t.tag,
    'Frecuencia (en 10 videos)': `${t.frequency} / ${benchmark.searchContext.totalVideosAnalyzed || 10}`,
    '% de Popularidad': `${t.frequencyPercentage}%`,
    'Vistas Acumuladas': t.accumulatedViews,
    'Score de Impacto (1-100)': t.impactScore,
    'Categoría': t.category,
    'Recomendación': t.recommendation,
    '¿La tienes en tu video?': t.userHasTag ? 'SÍ' : 'NO (Oportunidad)',
    'Videos que la usan': t.videosUsing.join(', '),
  }));
  const wsTags = XLSX.utils.json_to_sheet(tagData);
  XLSX.utils.book_append_sheet(wb, wsTags, 'Matriz de Etiquetas');

  // Sheet 3: Comparison & Patterns
  const comparisonData = [
    { 'Elemento': 'Canal Analizado', 'Tu Video': userVideo.channelName || 'Mi Canal', 'Promedio Top 10 Competencia': 'Otros canales del nicho' },
    { 'Elemento': 'Título', 'Tu Video': userVideo.title, 'Promedio Top 10 Competencia': `Longitud promedio: ${benchmark.commonPatterns.titleAvgLength || 60} caracteres` },
    { 'Elemento': 'Longitud Título (caracteres)', 'Tu Video': userVideo.title.length, 'Promedio Top 10 Competencia': benchmark.commonPatterns.titleAvgLength || 60 },
    { 'Elemento': 'Total Etiquetas Actuales', 'Tu Video': userVideo.tags.length, 'Promedio Top 10 Competencia': '15-25 etiquetas optimizadas' },
    { 'Elemento': 'Caracteres en Etiquetas (Máx 500)', 'Tu Video': userVideo.tags.join(', ').length, 'Promedio Top 10 Competencia': '420 - 480 caracteres' },
    { 'Elemento': 'Puntuación SEO Estimada', 'Tu Video': `${benchmark.userVideoAnalysis.seoScoreCurrent} / 100`, 'Promedio Top 10 Competencia': '90-98 / 100' },
    { 'Elemento': 'Puntuación SEO con Sugerencias', 'Tu Video': `${benchmark.optimizedSuggestions.predictedSeoScore} / 100`, 'Promedio Top 10 Competencia': 'Excelente' },
  ];
  const wsComparison = XLSX.utils.json_to_sheet(comparisonData);
  XLSX.utils.book_append_sheet(wb, wsComparison, 'Comparativa Tu Video');

  // Sheet 4: Optimized Proposals
  const titlesData = benchmark.optimizedSuggestions.titles.map((t, i) => ({
    'Opción': `Título ${i + 1}`,
    'Estilo / Enfoque': t.style,
    'Título Sugerido': t.title,
    'Caracteres': t.characterCount,
    'Por qué funciona': t.whyItWorks,
    'Palabras Clave Incluidas': t.includedKeywords.join(', '),
  }));
  const wsTitles = XLSX.utils.json_to_sheet(titlesData);
  XLSX.utils.book_append_sheet(wb, wsTitles, 'Títulos Sugeridos');

  // Sheet 5: Tags ready for YouTube Studio
  const tagsExportData = [
    {
      'Sección': 'LISTA COMPLETA PARA PEGAR EN YOUTUBE STUDIO (< 500 caracteres)',
      'Contenido': benchmark.optimizedSuggestions.tags.formattedCommaSeparated,
      'Total Caracteres': `${benchmark.optimizedSuggestions.tags.totalCharacters} / 500`,
    },
    {
      'Sección': 'Etiquetas Primarias (Nicho imprescindible)',
      'Contenido': benchmark.optimizedSuggestions.tags.breakdown.primary.join(', '),
      'Total Caracteres': '-',
    },
    {
      'Sección': 'Etiquetas Secundarias (Alto volumen)',
      'Contenido': benchmark.optimizedSuggestions.tags.breakdown.secondary.join(', '),
      'Total Caracteres': '-',
    },
    {
      'Sección': 'Etiquetas Long-Tail (Específicas)',
      'Contenido': benchmark.optimizedSuggestions.tags.breakdown.longTail.join(', '),
      'Total Caracteres': '-',
    },
    {
      'Sección': 'Descripción Optimizada Completa',
      'Contenido': benchmark.optimizedSuggestions.description.fullText,
      'Total Caracteres': benchmark.optimizedSuggestions.description.fullText.length,
    },
    {
      'Sección': 'Hashtags Recomendados',
      'Contenido': benchmark.optimizedSuggestions.description.suggestedHashtags.join(' '),
      'Total Caracteres': '-',
    },
  ];
  const wsTagsExport = XLSX.utils.json_to_sheet(tagsExportData);
  XLSX.utils.book_append_sheet(wb, wsTagsExport, 'Metadata Optimizada YouTube');

  // Write file
  const fileName = `Analisis_YouTube_Competencia_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function generateReportText(benchmark: BenchmarkResult, userVideo: UserVideo): string {
  const line = '═'.repeat(78);
  const thinLine = '─'.repeat(78);

  const topMissingTags = benchmark.tagMatrix
    .filter((t) => !t.userHasTag && (t.recommendation === 'Imprescindible' || t.frequency >= 5))
    .slice(0, 10);

  let text = `${line}
INFORME DE BENCHMARK Y OPTIMIZACIÓN SEO PARA YOUTUBE
Generado el: ${new Date().toLocaleString()}
${line}

1. DATOS DEL VIDEO ANALIZADO (TU CANAL)
${thinLine}
• Canal: ${userVideo.channelName || 'Mi Canal'}
• Título Original: ${userVideo.title || 'Sin título'} (${userVideo.title.length} caracteres)
• Puntuación SEO Actual: ${benchmark.userVideoAnalysis.seoScoreCurrent}/100
• Puntuación SEO Proyectada con Mejoras: ${benchmark.optimizedSuggestions.predictedSeoScore}/100
• Etiquetas Actuales (${userVideo.tags.length}): ${userVideo.tags.join(', ') || 'Ninguna'}
• Caracteres en Etiquetas: ${userVideo.tags.join(', ').length} de 500 permitidos

Puntos Fuertes Detectados:
${benchmark.userVideoAnalysis.strengths.map((s) => `  ✓ ${s}`).join('\n')}

Oportunidades de Mejora:
${benchmark.userVideoAnalysis.weaknesses.map((w) => `  ⚠ ${w}`).join('\n')}


2. BENCHMARK DE LOS 10 VIDEOS MÁS POPULARES Y RECIENTES (< 1 MES)
Búsqueda: "${benchmark.searchContext.queryUsed}"
${thinLine}
`;

  benchmark.competitors.forEach((c) => {
    text += `\n[TOP #${c.rank}] ${c.title}
  • Canal: ${c.channel} | Vistas: ${c.views} | Fecha: ${c.published}
  • URL: ${c.url}
  • Factor Clave: ${c.keySuccessFactor}
  • Etiquetas (${c.tags.length}): ${c.tags.slice(0, 12).join(', ')}${c.tags.length > 12 ? '...' : ''}
`;
  });

  text += `\n${line}
3. TABLA COMPARATIVA DE POPULARIDAD DE ETIQUETAS (TAGS FREQUENCY MATRIX)
Etiquetas más usadas en los 10 videos analizados y con mejor rendimiento
${thinLine}
`;

  text += `Rnk | Frec. | % Uso | Score | Estado en tu Video | Etiqueta\n`;
  text += `----+-------+-------+-------+--------------------+------------------------\n`;

  benchmark.tagMatrix.forEach((t, i) => {
    const rankStr = String(i + 1).padStart(2, ' ');
    const freqStr = `${t.frequency}/10`.padEnd(5, ' ');
    const pctStr = `${t.frequencyPercentage}%`.padStart(5, ' ');
    const scoreStr = `${t.impactScore}/100`.padStart(5, ' ');
    const hasTagStr = t.userHasTag ? '✓ YA LA TIENES   ' : '★ FALTA (AGREGAR)';
    text += `${rankStr}  | ${freqStr} | ${pctStr} | ${scoreStr} | ${hasTagStr} | ${t.tag}\n`;
  });

  if (topMissingTags.length > 0) {
    text += `\nETIQUETAS CRÍTICAS QUE TIENEN LOS 10 MEJORES Y QUE LE FALTAN A TU VIDEO:
${topMissingTags.map((t) => `  • "${t.tag}" (Usada en ${t.frequency} de 10 videos - Vistas: ${t.accumulatedViews})`).join('\n')}
`;
  }

  text += `\n${line}
4. PATRONES COMUNES EN LOS VIDEOS EXITOSOS
${thinLine}
• Longitud promedio de títulos: ${benchmark.commonPatterns.titleAvgLength || 62} caracteres
• Palabras más frecuentes en títulos: ${benchmark.commonPatterns.popularTitleWords.join(', ')}
• Fórmulas de éxito:
${benchmark.commonPatterns.popularFormulas.map((f) => `  → ${f}`).join('\n')}
• Patrones en descripciones:
${benchmark.commonPatterns.descriptionPatterns.map((d) => `  → ${d}`).join('\n')}


${line}
5. PROPUESTAS DE TÍTULOS OPTIMIZADOS (BASADOS EN LO QUE FUNCIONÓ)
${thinLine}
`;

  benchmark.optimizedSuggestions.titles.forEach((t, idx) => {
    text += `\nOPCIÓN ${idx + 1} [${t.style.toUpperCase()}]
Título: ${t.title}
Longitud: ${t.characterCount} caracteres (Ideal para no cortarse en móvil)
Por qué funciona: ${t.whyItWorks}
Keywords incluidas: ${t.includedKeywords.join(', ')}
`;
  });

  text += `\n${line}
6. LISTA MAESTRA DE ETIQUETAS PARA YOUTUBE STUDIO
${thinLine}
Total de caracteres: ${benchmark.optimizedSuggestions.tags.totalCharacters} / 500 caracteres permitidos.
Copia y pega directamente en la casilla de etiquetas de YouTube Studio:

${benchmark.optimizedSuggestions.tags.formattedCommaSeparated}


${line}
7. DESCRIPCIÓN OPTIMIZADA COMPLETA
${thinLine}
[VISTA PREVIA DE LAS PRIMERAS 2 LÍNEAS - LO QUE SE VE EN BÚSQUEDAS]
${benchmark.optimizedSuggestions.description.firstTwoLinesSnippet}

[TEXTO COMPLETO PARA COPIAR Y PEGAR]
${benchmark.optimizedSuggestions.description.fullText}

Hashtags sugeridos:
${benchmark.optimizedSuggestions.description.suggestedHashtags.join(' ')}


${line}
8. RECOMENDACIONES ESTRATÉGICAS FINALES
${thinLine}
${benchmark.optimizedSuggestions.strategicAdvice
  .map(
    (adv) => `• [${adv.aspect}]:
  Tendencia de la competencia: ${adv.competitorTrend}
  Recomendación para tu canal: ${adv.actionableRecommendation}
`
  )
  .join('\n')}

${line}
Fin del informe. ¡Mucho éxito con tu video en YouTube!
${line}`;

  return text;
}

export function exportToNotepad(benchmark: BenchmarkResult, userVideo: UserVideo) {
  const content = generateReportText(benchmark, userVideo);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Analisis_YouTube_Notepad_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv(benchmark: BenchmarkResult) {
  const headers = [
    'Ranking',
    'Etiqueta',
    'Frecuencia_Top10',
    'Porcentaje_Uso',
    'Vistas_Acumuladas',
    'Score_Impacto',
    'Categoria',
    'Recomendacion',
    'En_Tu_Video',
  ];

  const rows = benchmark.tagMatrix.map((t, idx) => [
    idx + 1,
    `"${t.tag.replace(/"/g, '""')}"`,
    t.frequency,
    `${t.frequencyPercentage}%`,
    `"${t.accumulatedViews}"`,
    t.impactScore,
    `"${t.category}"`,
    `"${t.recommendation}"`,
    t.userHasTag ? 'SI' : 'NO',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Matriz_Etiquetas_YouTube_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
