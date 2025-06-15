'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ImportHealthData() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('healthData', file);

    try {
      const response = await axios.post(
        '/api/sleep/import-health-data',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessage(`Successfully imported ${response.data.count} sleep records`);
    } catch (error) {
      setMessage('Error importing data. Please try again.');
      console.error('Import error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className='border-t pt-4'>
      <h3 className='text-lg font-medium mb-3'>Import from Apple Health</h3>

      <div className='space-y-3'>
        <div>
          <p className='mb-2 text-sm text-gray-700'>
            Follow these steps to import your sleep data:
          </p>
          <ol className='list-decimal ml-5 text-sm text-gray-700'>
            <li>Open the Health app on your iPhone</li>
            <li>Tap your profile picture in the top right</li>
            <li>Scroll down and tap "Export All Health Data"</li>
            <li>Wait for the export to complete and save the file</li>
            <li>Upload the export.zip file below</li>
          </ol>
        </div>

        <div className='mt-4'>
          <label className='block text-sm font-medium text-gray-700'>
            Upload Health Data Export
            <input
              type='file'
              accept='.zip'
              onChange={handleFileUpload}
              className='mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100'
            />
          </label>
        </div>

        {isUploading && (
          <div className='text-blue-600 text-sm'>
            <div className='animate-pulse'>Processing your health data...</div>
            <div className='text-xs mt-1'>
              This may take a moment depending on the file size
            </div>
          </div>
        )}

        {message && (
          <div
            className={`text-sm ${
              message.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
