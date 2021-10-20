const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const path = require('path');
const fs = require('fs')
const JSZip = require('jszip')

const removeEverythingBeforeTable = (pageTextArray, table) => {
  let tableFound = false;
  return ((pageTextArray.items.map((item, index, array) => {

    const quadro = (index + 2 < array.length) ? (item.str + array[index + 1 ].str + array[index + 2].str) : ''

    if (quadro.includes(table)) tableFound = true

    if (tableFound) return item

  })).filter((item) => item !== undefined))
}

const pdfToCsvToZip = async (tables) => {
  const filename = 'padrao_tiss_componente_organizacional_202108.pdf'
  const pdfPath = path.resolve(__dirname, 'downloads', filename)
  const pdf = await pdfjs.getDocument({ url:pdfPath, useSystemFonts: true }).promise

  const pdfTables = await Promise.all(tables.map(async (table) => {
    let content = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const pageTextArray = await (await pdf.getPage(i)).getTextContent()
      const pageTextString = (pageTextArray.items.map((item) => item.str)).join('')

      if (pageTextString.includes(table)) {
        const removedArray = removeEverythingBeforeTable(pageTextArray, table)
        const removedString = (removedArray.map((item) => item.str)).join('')
        removedArray.forEach((item) => content.push(item))

        if (removedString.includes('Fonte: Elaborado pelos autores.')) break;

        i += 1
        for (let l = i; l <= pdf.numPages; l++) {
          const nextPageTextArray = await (await pdf.getPage(l)).getTextContent()
          const nextPageTextString = (nextPageTextArray.items.map((item) => item.str)).join('')

          nextPageTextArray.items.forEach((item) => content.push(item))
  
          if (nextPageTextString.includes('Fonte: Elaborado pelos autores.')) break;
        }
        break
      }
    }

    return {
      table: table,
      content
    }
  }))

  pdfTables.forEach((table) => {
    tableString = ((table.content.filter((item) => item.height === 8.04)).map((item) => item.str)).join('')
    const allMatches = [...tableString.matchAll(/(?<cd>\d+)\s(?<content>.+?(?=\d|$|Fonte))/gm)]
    let foundFirstTableElement = false
    const filteredTable = []
    allMatches.forEach(({ groups }) => {
      if (groups.cd === '1' || foundFirstTableElement) {
        foundFirstTableElement = true
        filteredTable.push(groups)
      }
    })

    let baseTableText = `"Código";"Descrição da categoria"\n`;

    filteredTable.every((element, index, array) => {
      baseTableText += `"${element.cd}";"${(element.content).trim()}"\n`
      if (index === array.length -1) return false
      if (Number(element.cd) > Number(array[index+1].cd)){
        return false
      }
      return true
    })

    fs.writeFileSync(`./csvs/${table.table}.csv`, baseTableText, {encoding: 'utf8'})
    console.log(`Created ${table.table}.csv`)
  })

  const zip = new JSZip();

  tables.forEach((table) => {
    zip.file(`${table}.csv`, fs.readFileSync(`./csvs/${table}.csv`))
  })

  const writeStream = fs.createWriteStream('./csvs/Teste_Intuitive_Care_Gabriel.zip')

  zip.generateNodeStream({type : 'nodebuffer', streamFiles:true}).pipe(writeStream)
  console.log(`Created Teste_Intuitive_Care_Gabriel.zip`)
};

(async () => await pdfToCsvToZip(['Quadro 30', 'Quadro 31', 'Quadro 32']))()