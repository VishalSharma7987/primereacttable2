import { useState, useRef, useEffect } from 'react';
import 'primereact/resources/themes/saga-blue/theme.css';  // Theme
import 'primereact/resources/primereact.min.css';          // Core CSS
import 'primeicons/primeicons.css';                        // Icons
import 'primeflex/primeflex.css';              
import './App.css';

import { Paginator } from 'primereact/paginator';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

interface DataItem {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

function App() {
  const [data, setData] = useState<DataItem[]>([]);  // State to hold table data
  const [loading, setLoading] = useState(true);  // Loading state
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<DataItem[]>([]);
  const [rows, setRows] = useState<number>(12);   // Rows per page
  const [totalRecords, setTotalRecords] = useState<number>(0); 
  const [inputRowCount, setInputRowCount] = useState<number>(1); // Default input for number of rows to select

  const overlayPanelRef = useRef<OverlayPanel>(null); // Reference to the OverlayPanel

  useEffect(() => {
    fetchData(currentPage, rows);
  }, [currentPage, rows]);

  const fetchData = async (page: number, rows: number) => {
    setLoading(true);  // Start loading
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page + 1}&limit=${rows}`);
      const result = await response.json();  // Convert to JSON
      if (result && result.data) {
        setData(result.data); // Set only the `data` field in state
        setTotalRecords(result.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // Stop loading after fetch is complete
    }
  };

  const onPageChange = (event: { first: number, rows: number }) => {
    const newPageIndex = event.first / event.rows; // Calculate new page index
    setCurrentPage(newPageIndex); // Update current page
    setRows(event.rows); // Update rows per page
    fetchData(newPageIndex, event.rows); // Fetch new page data
  };

  const onSelectionChange = (e: { value: DataItem[] }) => {
    const newSelection = e.value;
    setSelectedRows(newSelection);
  };

  useEffect(() => {
    // Clear the selected rows when the page is reloaded
    setSelectedRows([]);
  }, []);

  const handleAutoSelect = async () => {
    let newSelectedRows: DataItem[] = [...selectedRows];
    let remainingRows = inputRowCount - newSelectedRows.length;
    let page = currentPage;

    const fetchPageData = async (page: number): Promise<DataItem[]> => {
      try {
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page + 1}&limit=${rows}`);
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('Error fetching data:', error);
        return [];
      }
    };

    while (remainingRows > 0) {
      const currentPageData = await fetchPageData(page);

      if (currentPageData.length === 0) {
        console.warn('No more data available to select.');
        break;
      }

      const rowsToSelect = Math.min(remainingRows, currentPageData.length);
      newSelectedRows = [...newSelectedRows, ...currentPageData.slice(0, rowsToSelect)];

      remainingRows -= rowsToSelect;
      page += 1;
    }

    console.log(`Selected ${newSelectedRows.length} rows out of the requested ${inputRowCount}.`);

    setSelectedRows(newSelectedRows); 
    overlayPanelRef.current?.hide();
    setInputRowCount(1);
  };

  const chevronDownIcon = (
    <i
      className="pi pi-chevron-down"
      style={{ cursor: 'pointer' }}
      onClick={(e) => overlayPanelRef.current?.toggle(e)}
    />
  );

  return (
    <>
      <div className="card">
        <h3>My Data Table</h3>
        <DataTable
          value={data}
          dataKey="id"
          loading={loading}
          selection={selectedRows}
          stripedRows
          rows={rows}
          first={currentPage * rows}
          totalRecords={totalRecords}
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
          <Column className="b" header={<span>{chevronDownIcon}</span>} />
          <Column field="id" header="ID" />
          <Column field="title" header="Title" />
          <Column field="place_of_origin" header="Place of Origin" />
          <Column field="artist_display" header="Artist Display" />
          <Column field="inscriptions" header="Inscriptions" />
          <Column field="date_start" header="Date Start" />
          <Column field="date_end" header="Date End" />
        </DataTable>

        <Paginator
          first={currentPage * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
        />

        <OverlayPanel className='overpannel' ref={overlayPanelRef} style={{ width: '200px' }}>
          <InputText className='inputext'
            type="number"
            value={inputRowCount.toString()}
            onChange={(e) => setInputRowCount(Number(e.target.value))}
            placeholder="Select Rows"
          />
          <Button label="submit" className='button' onClick={handleAutoSelect} />
        </OverlayPanel>
      </div>
    </>
  );
}

export default App;
