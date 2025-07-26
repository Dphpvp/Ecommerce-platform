import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const ProductImport = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [importResults, setImportResults] = useState(null);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      previewCSV(selectedFile);
    } else {
      showToast('Please select a valid CSV file', 'error');
      setFile(null);
      setPreview([]);
    }
  };

  const previewCSV = (csvFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').slice(0, 6); // Show first 5 rows + header
      const preview = lines.map(line => line.split(',').map(cell => cell.trim()));
      setPreview(preview);
    };
    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    if (!file) {
      showToast('Please select a CSV file first', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/admin/products/import`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it for FormData
        }
      });

      setImportResults(response);
      showToast(`Successfully imported ${response.success_count} products`, 'success');
      
      if (response.errors && response.errors.length > 0) {
        showToast(`${response.errors.length} products had errors`, 'warning');
      }
    } catch (error) {
      console.error('Import failed:', error);
      showToast(error.message || 'Failed to import products', 'error');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,description,price,category,image_url,stock,brand,sku\n' +
                      'Sample Product,A great product,29.99,Electronics,https://example.com/image.jpg,100,BrandName,SKU001\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-product-import">
      <div className="container">
        <div className="import-header">
          <h1>📤 Import Products</h1>
          <div className="header-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="btn btn-outline"
            >
              ← Back to Products
            </button>
          </div>
        </div>

        <div className="import-content">
          
          {/* Instructions Section */}
          <div className="import-section">
            <h3>📋 Import Instructions</h3>
            <div className="instructions">
              <ol>
                <li>Download the CSV template below</li>
                <li>Fill in your product data following the template format</li>
                <li>Required fields: name, description, price, category, image_url, stock</li>
                <li>Optional fields: brand, sku</li>
                <li>Upload your completed CSV file</li>
              </ol>
              <button onClick={downloadTemplate} className="btn btn-primary">
                📥 Download Template
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="import-section">
            <h3>📂 Select CSV File</h3>
            <div className="file-upload">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="file-input"
                id="csv-file"
              />
              <label htmlFor="csv-file" className="file-label">
                {file ? `📄 ${file.name}` : '📁 Choose CSV File'}
              </label>
            </div>
          </div>

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="import-section">
              <h3>👁️ Preview (First 5 rows)</h3>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {preview[0]?.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Action */}
          {file && (
            <div className="import-section">
              <div className="import-actions">
                <button
                  onClick={handleImport}
                  disabled={uploading}
                  className="btn btn-primary btn-large"
                >
                  {uploading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Importing...
                    </>
                  ) : (
                    <>
                      🚀 Import Products
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {importResults && (
            <div className="import-section">
              <h3>📊 Import Results</h3>
              <div className="import-results">
                <div className="result-summary">
                  <div className="result-stat success">
                    <span className="stat-number">{importResults.success_count}</span>
                    <span className="stat-label">Successfully Imported</span>
                  </div>
                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="result-stat error">
                      <span className="stat-number">{importResults.errors.length}</span>
                      <span className="stat-label">Errors</span>
                    </div>
                  )}
                </div>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="error-list">
                    <h4>❌ Errors Found:</h4>
                    <ul>
                      {importResults.errors.map((error, index) => (
                        <li key={index}>
                          <strong>Row {error.row}:</strong> {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="result-actions">
                  <button
                    onClick={() => navigate('/admin/products')}
                    className="btn btn-primary"
                  >
                    View Products
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-outline"
                  >
                    Import More
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductImport;