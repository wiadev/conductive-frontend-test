import * as d3 from 'd3'
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { useRef, useEffect } from 'react'

let sankey = d3Sankey()

function drawSankeyDiagram(sankeyData, element, options) {
  const { width: containerWidth, height: containerHeight } =
    element.getBoundingClientRect()

  const {
    nodePadding = 40,
    nodeWidth = 25,
    margin = { top: 10, right: 10, bottom: 10, left: 10 }
  } = options || {}

  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  const formatNumber = d3.format(',.0f'), 
    format = function (d) {
      return formatNumber(d)
    },
    color = d3
      .scaleOrdinal()
      .range(['#002060ff', '#164490ff', '#4d75bcff', '#98b3e6ff', '#008cb0ff'])

  const svg = d3
    .select(element)
    .html('')
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  sankey
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .size([width, height])
    .nodeId((v) => v.id)
    .nodeSort((a, b) => a.order - b.order)

  const graph = sankey(sankeyData)

  const link = svg
    .append('g')
    .attr('fill', 'none')
    .selectAll('.link')
    .data(graph.links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', sankeyLinkHorizontal())
    .style('stroke-width', function (d) {
      return `${Math.ceil(d.width)}px`
    })
    .style('stroke', function (d) {
      return color(d.index)
    })

  link.append('title').text(function (d) {
    return `${d.source.name} → ${d.target.name} 
    token: ${d.metaValue.tAmount}
    transaction: ${d.metaValue.tCount}`
  })

  const node = svg
    .append('g')
    .selectAll('.node')
    .data(graph.nodes)
    .enter()
    .append('g')
    .attr('class', 'node')

  node
    .append('rect')
    .attr('x', function (d) {
      return d.x0
    })
    .attr('y', function (d) {
      return d.y0
    })
    .attr('height', function (d) {
      return d.y1 - d.y0
    })

    .attr('width', sankey.nodeWidth())
    .style('fill', function (d) {
      return d.color
    })
    .style('stroke', function (d) {
      return d.color
    })
    .append('title')
    .text(function (d) {
      return d.name + '\n' + format(d.metaValue.tAmount)
    })

  node
    .append('text')
    .attr('x', function (d) {
      return d.x0 - 6
    })
    .attr('y', function (d) {
      return (d.y1 + d.y0) / 2
    })
    .attr('dy', '0.5em')
    .attr('text-anchor', 'end')
    .text(function (d) {
      return d.name
    })
    .filter(function (d) {
      return d.x0 < width / 2
    })
    .attr('x', function (d) {
      return d.x1 + 6
    })
    .attr('text-anchor', 'start')
}

function SankeyDiagram({ linkData, options }) {
  const diagramRef = useRef()

  useEffect(() => {
    if (diagramRef.current && diagramRef.current.getBoundingClientRect) {
      drawSankeyDiagram(linkData, diagramRef.current, options)
    }
  }, [linkData, options])

  return <div ref={diagramRef} className="chart"></div>
}

export default SankeyDiagram
