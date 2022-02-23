import { useEffect, useState } from 'react'
import * as d3 from 'd3'
import './App.css'
import csvFile from './csv/quidd-bsc-transfers-0x7961Ade0a767c0E5B67Dd1a1F78ba44F727642Ed.csv'

import convertData from './convertData'
import SankeyDiagram from './SankeyDiagram'

function App() {
  const [linkData, setLinkData] = useState(null)

  useEffect(() => {
    async function fetchCSV() {
      const data = await d3.csv(csvFile)

      const linkData = convertData(data)
      setLinkData(linkData)
    }
    fetchCSV()
  }, [])

  return (
    <div className="App">
      <div className="graph-container">
        {linkData ? <SankeyDiagram linkData={linkData} /> : null}
      </div>
    </div>
  )
}

export default App
