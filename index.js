const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const path = require('path');
const fs = require('fs')
const JSZip = require('jszip')

const findInPage = async (page, search) => {
  const textContent = await page.getTextContent()
  const textString = (textContent.items.map((item) => item.str)).join('')
  return textString.includes(search)
}

const getTableTextUnformmated = async (tableTitle) => {
  const filename = 'padrao_tiss_componente_organizacional_202108.pdf'
  const loadedPdf = await pdfjs.getDocument(path.resolve(__dirname, 'downloads', filename)).promise

  const numberOfPages = loadedPdf.numPages

  let tablePages = []

  for (let i = 1; i <= numberOfPages; i++) {
    let page = await loadedPdf.getPage(i)
    let searchString = tableTitle

    let found = await findInPage(page, searchString)

    if (found) {

      tablePages.push({
        page: i,
        content: (await page.getTextContent())
      })

      for (let u = i;i <= numberOfPages; i++) {
        page = await loadedPdf.getPage(i);
        searchString = 'Fonte: Elaborado pelos autores.'

        found = await findInPage(page, searchString)

        if (u !== i){
          tablePages.push({
            page: i,
            content: (await page.getTextContent())
          })
        }

        if (found) break;
      }
      break;
    }
  }

  tablePages = tablePages.map((page) => {
    let quadroIndex = null;
    const content = page.content.items.filter((item, index, array) => {

      //I need to find 'Quadro XX' and check if the array is near the end
      const quadro = (index + 2 < array.length) ? (item.str + array[index + 1 ].str + array[index + 2].str) : ''

      if(quadro.includes(tableTitle)){
        quadroIndex = index
      }
      if (quadroIndex) {
        return !!quadroIndex
      }
    })
    if(quadroIndex) {
      return {
        page: page.page,
        content: ((content.filter((item) => item.height === 8.04)).map((item) => item.str)).join('')
      }
    }
    return{
      page: page.page,
      content: ((page.content.items.filter((item) => item.height === 8.04)).map((item) => item.str)).join('')
    }
  })

  const onlyTableText = tablePages.map((page, index, array) => {
    if(page.content.includes('Fonte: Elaborado pelos autores.')) {
      return page.content.replace('Fonte: Elaborado pelos autores.', '\n')
    }
    return page.content
  })

  return onlyTableText.join('')

};

const saveToCsv = async (tableTitle) => {
  const table = await getTableTextUnformmated(tableTitle)

  const tableArray = table.match(/(?<cd>\d+)\s(?<content>.*?(?=\d|$))/gm)
  const tableArraySeparated = tableArray.map((row) => row.trim().split(' '))
  if (tableTitle === 'Quadro 31') {
    tableArraySeparated.pop()
    tableArraySeparated.pop()
    tableArraySeparated.pop()
  }

  let baseTableText = `"Código";"Descrição da categoria"\n`;

  tableArraySeparated.forEach((arg, index) => {
    const [first, ...rest] = arg
    baseTableText += `"${first}";"${rest.join(' ')}"\n`
  })

  fs.writeFileSync(`./csvs/${tableTitle}.csv`, baseTableText, {encoding: 'utf8'})
};

(async () => {
  await saveToCsv('Quadro 30')
  await saveToCsv('Quadro 31')
  await saveToCsv('Quadro 32')

  const zip = new JSZip();

  zip.file('Quadro 30.csv', fs.readFileSync('./csvs/Quadro 30.csv'))
  zip.file('Quadro 31.csv', fs.readFileSync('./csvs/Quadro 31.csv'))
  zip.file('Quadro 32.csv', fs.readFileSync('./csvs/Quadro 32.csv'))

  const writeStream = fs.createWriteStream('./csvs/Teste_Intuitive_Care_Gabriel.zip')

  zip.generateNodeStream({type : 'nodebuffer', streamFiles:true}).pipe(writeStream)
})()
