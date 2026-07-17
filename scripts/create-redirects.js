/**
 * @file create-redirects.js
 * @description Cria arquivos index.html de redirecionamento para diretórios
 * que precisam ser acessíveis com barra trailing no export estático.
 */

import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'out');

/**
 * Cria um arquivo index.html de redirecionamento para um diretório
 */
function createRedirectIndex(dirPath, targetHtml) {
  const indexPath = path.join(dirPath, 'index.html');
  const content = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=${targetHtml}">
  <script>
    window.location.href = '${targetHtml}';
  </script>
</head>
<body>
  <p>Redirecionando para <a href="${targetHtml}">${targetHtml}</a>...</p>
</body>
</html>`;
  
  fs.writeFileSync(indexPath, content);
  console.log(`✓ Criado redirecionamento: ${indexPath} → ${targetHtml}`);
}

/**
 * Processa diretórios que precisam de index.html
 */
function createRedirects() {
  console.log('Criando redirecionamentos para diretórios...');
  
  // Lista de diretórios que precisam de index.html
  const redirects = [
    { dir: 'tutoriais', target: '/tutoriais.html' },
    { dir: 'info/cas-token', target: '/info/cas-token.html' },
    { dir: 'certificado', target: '/certificado.html' },
  ];
  
  redirects.forEach(({ dir, target }) => {
    const dirPath = path.join(outDir, dir);
    if (fs.existsSync(dirPath)) {
      createRedirectIndex(dirPath, target);
    } else {
      console.log(`⚠ Diretório não encontrado: ${dirPath}`);
    }
  });
  
  console.log('Redirecionamentos criados com sucesso!');
}

createRedirects();
