const PrintStyles = () => {
  return (
    <style>{`
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }

        body {
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          background: white;
          font-family: 'Times New Roman', serif;
        }

        .print\\:hidden {
          display: none !important;
        }

        .print\\:block {
          display: block !important;
        }

        /* Better table formatting for print */
        table {
          border-collapse: collapse;
          width: 100%;
          page-break-inside: avoid;
        }

        thead {
          display: table-header-group;
        }

        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        th {
          font-weight: bold;
          text-align: left;
          border-bottom: 2px solid #000;
          padding: 4pt 8pt !important;
        }

        td {
          border-bottom: 1px solid #ddd;
          padding: 3pt 8pt !important;
          vertical-align: top;
        }

        /* Ensure staff sections don't break across pages */
        .print\\:block > div {
          page-break-inside: avoid;
        }

        /* Headers and text formatting */
        h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0 0 8pt 0;
        }

        h2 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0 0 4pt 0;
        }

        /* Remove colors and shadows */
        .bg-gray-50 {
          background-color: #f9f9f9 !important;
        }

        .shadow-sm, .shadow-lg {
          box-shadow: none !important;
        }

        .rounded-lg, .rounded-xl {
          border-radius: 0 !important;
        }

        /* Status formatting for print */
        .text-green-700 {
          color: #000;
          font-weight: bold;
        }

        .text-yellow-700 {
          color: #000;
          font-style: italic;
        }

        .text-red-700.line-through {
          color: #666;
          text-decoration: line-through;
        }

        /* Hide interactive elements */
        button, select, input {
          display: none !important;
        }

        /* Adjust margins and padding */
        .container {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    `}</style>
  )
}

export default PrintStyles