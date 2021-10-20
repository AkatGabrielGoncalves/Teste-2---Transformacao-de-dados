# **Teste-2---Transformacao-de-dados**

- This project is part of a set of other tests. Check it out:
  - [Test 1 - Web Scrapping](https://github.com/AkatGabrielGoncalves/Teste-1---WebScraping)
  - [Test 3 - Banco de dados](https://github.com/AkatGabrielGoncalves/Teste-3---Banco-de-dados)
  - [Test 4 - Frontend](https://github.com/AkatGabrielGoncalves/Teste-4---FrontEnd)

## **What does this project do?**
- It transforms three PDF tables into .csv files and zips them.
- How?
  - Search for Quadro 30, Quadro 31 and Quadro 32 inside the file   (padrao_tiss_componente_organizacional_202108.pdf).
  - Removes everything before them.
  - Removes everything that is not from the original table.
  - Saves Quadro 30, Quadro 31 and Quadro 32 as .csv files.
  - Zips the three files.

## **How to run**
- Install dependencies.
```
yarn install
```
- Run the script.
```
yarn start
```
## **Dependencies**

- PDF.js
- jszip

## **Details**
- Written in JavaScript.
- This project uses PDF.js from mozilla to read and manipulate PDFs and jszip to create .zip files.