import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  createCertificate,
  updateCertificate,
  getCertificateById,
  getLatestCertificate,
} from '../api/certificateApi';
import { getCustomers, createCustomer } from '../api/customerApi';
import { getItems, createItem, getItemByCode } from '../api/itemApi';
import CreatableSelect from 'react-select/creatable';
import { getNextCertificateSuffix } from '../api/certificateApi';

// ────────────────────────────────────────────────────────────────
// Financial-year helpers for frontend preview and suffix reload
function fyStart(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();           // 0-based
  return m >= 3 ? y : y - 1;
}
function fyRange(date = new Date()) {
  const start = fyStart(date);
  return `${start}-${(start + 1).toString().slice(-2)}`;
}
// ────────────────────────────────────────────────────────────────


const CertificateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const initialFormState = {
    certificateNoSuffix: '',
    certificateDate: '',
    
    customerName: '',
    customerAddress: '',
    items: [
      { code: '', material: '', size: '', id: null },
      { code: '', material: '', size: '', id: null }
    ],
    qtyTreated1: '',
    qtyTreated2:'',
    truckNo: '',
    batchNumber: '',
    soNumber: '',
    containerNumber: '',
    country: '',
    note: '',
    dateOfTreatment: '',
    attainingTimeMins: '',
    totalTreatmentTimeMins: '',
    moistureBeforeTreatment: '',
    moistureAfterTreatment: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customerRes, itemRes] = await Promise.all([
          getCustomers(),
          getItems()
        ]);
        setCustomers(Array.isArray(customerRes) ? customerRes : []);
        setItems(Array.isArray(itemRes) ? itemRes : []);

        if (isEditing) {
          const cert = await getCertificateById(id);

          const certDate = cert.certificateDate ? cert.certificateDate.slice(0,10) : '';
          const treatDate = cert.dateOfTreatment ? cert.dateOfTreatment.slice(0,10) : '';
          const rows = cert.items.map((it) => ({
            code: it.item.code,
            material: it.materialOverride || it.item.material,
            size: it.sizeOverride || it.item.size,
            id: it.item._id
          }));
          while (rows.length < 2) rows.push({ code: '', material: '', size: '', id: null });
          setFormData({ ...cert,
            certificateDate: certDate,
              dateOfTreatment: treatDate, 
              items: rows });
       
        }else{
          const latest = await getLatestCertificate()
          if(latest){

             latest.certificateDate = latest.certificateDate?.slice(0, 10) || '';
             latest.dateOfTreatment = latest.dateOfTreatment?.slice(0, 10) || '';
            const rows = (latest.items || []).map((r) => ({
              code:r.code,
              material:r.material,
              size:r.size,
              id: r.id || null,
            }));

          while (rows.length < 2) rows.push({ code:'', material:'', size:'', id:null });
          setFormData((p) => ({ ...p, ...latest, items: rows }));
          }
        }
      } catch {
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleChange = async (e) => {
    const { name, value } = e.target;

    /* When user picks certificateDate (create mode) => fetch suffix */
    if (name === 'certificateDate' && !isEditing) {

      if (!value) {
        // date cleared ⇒ clear suffix + FY preview
        setFormData((p) => ({ ...p, certificateDate: '', certificateNoSuffix: '' }));
        return;
      }
    
      setFormData((p) => ({ ...p, certificateDate: value }));

      try {
        console.log('Fetching with date param:', value);
        const { nextSuffix } = await getNextCertificateSuffix(value);


        console.log('Fetched suffix →', nextSuffix);// pass the picked date
        setFormData((p) => ({ ...p, certificateNoSuffix: nextSuffix }));
      } catch {
        /* ignore */
      }
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleCustomerChange = (opt) => {
    const val = opt?.value || '';
    const found = customers.find((c) => c.name === val);
    setFormData((p) => ({
      ...p,
      customerName: val,
      customerAddress: found ? found.address : ''
    }));
  };
  

  const handleItemCodeChange = (idx) => async (opt) => {
    const code = opt?.value || '';
    if (!code) return;
    let doc = null;
    try {
      doc = await getItemByCode(code);
    } catch {}
    setFormData((p) => {
      const rows = [...p.items];
      rows[idx] = {
        ...rows[idx],
        code,
        id: doc?._id || null,
        material: doc?.material || '',
        size: doc?.size || ''
      };
      return { ...p, items: rows };
    });
  };

  const handleRowInput = (idx, field) => (e) => {
    const val = e.target.value;
    setFormData((p) => {
      const rows = [...p.items];
      rows[idx][field] = val;
      return { ...p, items: rows };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true)
    try {
      // 1. Create customer if it doesn't exist
      if (formData.customerName) {
        const existingCustomer = customers.find(
          (c) => c.name.toLowerCase() === formData.customerName.toLowerCase()
        );
        if (!existingCustomer) {
          try {
            const created = await createCustomer({
              name: formData.customerName,
              address: formData.customerAddress,
            });
            setCustomers((prev) => [...prev, created]);
          } catch (err) {
            alert('Failed to create new customer');
            return; // stop form submission if customer creation fails
          }finally{
            setSubmitting(false)
          }
        }
      }
  
      // 2. Create or find items
      const itemsPayload = await Promise.all(
        formData.items
          .filter((r) => r.code)
          .map(async (r) => {
            let id = r.id;
            if (!id) {
              const created = await createItem({ code: r.code, material: r.material, size: r.size });
              id = created._id;
            }
            return { item: id, materialOverride: r.material, sizeOverride: r.size };
          })
      );
  
      // 3. Prepare payload with updated items array
      const payload = { ...formData, items: itemsPayload };

   
  
      // 4. Create or update certificate
      if (isEditing) {
        await updateCertificate(id, payload);
      } else {
        await createCertificate(payload);
      }
  
      alert(`Certificate ${isEditing ? 'updated' : 'created and PDF generated'} successfully!`);
      navigate('/certificates');
    } catch {
      alert(`Failed to ${isEditing ? 'update' : 'create'} certificate`);
    }
  };
  

  if (loading) return <div className="p-6 text-center text-lg text-gray-600">Loading…</div>;
  if (error) return <div className="p-6 text-center text-lg text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl bg mx-auto p-4 sm:p-8 bg-yellow-200 rounded-3xl shadow-xl">
      <h2 className="text-2xl font-semibold font-serif mb-8 text-gray-800 text-center">
        {isEditing ? 'Edit Certificate' : 'Create New Certificate'}
      </h2>
       

      <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">

        {/* Certificate Date */}
        <div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Certificate Date
  </label>
  <input
    type="date"
    name="certificateDate"
    value={formData.certificateDate}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
 </div>


   {/* Certificate No (Suffix) */}
   <div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Certificate No (Suffix)
  </label>
  <input
  type="text"
  name="certificateNoSuffix"
  value={formData.certificateNoSuffix}   // use value directly, no fallback
  onChange={isEditing ? handleChange : undefined} // editable only when editing
  placeholder={!isEditing ? "001" : ""}  // show placeholder hint only on create
  readOnly={!isEditing}  // read-only if creating new certificate
  className={`w-full rounded-lg border border-gray-300
    ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white text-gray-800'}
    px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all`}
/>

</div>


  {/* FY range preview */}
  {formData.certificateDate && (
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
               Year
            </label>
            <input
              type="text"
              readOnly
              value={fyRange(new Date(formData.certificateDate))}
              className="w-full rounded-lg border bg-gray-100 px-4 py-2 text-gray-600 cursor-not-allowed"
            />
          </div>
        )}

{/* Date of Treatment */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Date of Treatment
  </label>
  <input
    type="date"
    name="dateOfTreatment"
    value={formData.dateOfTreatment}
    onChange={handleChange}
    required
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>


{/* Truck Number */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Truck Number
  </label>
  <input
    type="text"
    name="truckNo"
    value={formData.truckNo}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

{/* Customer Name (CreatableSelect) */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Company Name
  </label>
  <div className="rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-200">
    <CreatableSelect
      value={
        formData.customerName
          ? { label: formData.customerName, value: formData.customerName }
          : null
      }
      onChange={handleCustomerChange}
      options={customers.map((c) => ({
        label: c.name,
        value: c.name
      }))}
      placeholder="Select or create..."
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: '0.5rem',
          borderColor: '#D1D5DB',
          padding: '2px',
          boxShadow: 'none',
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected ? '#2563eb' : '#fff',
          color: state.isSelected ? '#fff' : '#000',
          padding: '10px',
        }),
      }}
    />
  </div>
</div>

{/* Customer Address */}
<div className="mb-6 sm:col-span-2">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Company Address
  </label>
  <input
    type="text"
    name="customerAddress"
    value={formData.customerAddress}
    onChange={handleChange}
    required
    placeholder="Full address"
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>


{/* Batch Number */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Batch Number
  </label>
  <input
    type="text"
    name="batchNumber"
    value={formData.batchNumber}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

{/* SO Number */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    SO Number
  </label>
  <input
    type="text"
    name="soNumber"
    value={formData.soNumber}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

{/* Items */}
{formData.items.map((row, idx) => (
  <div key={idx} className="mb-6 sm:col-span-2 grid sm:grid-cols-3 gap-2">
    {/* Item Code */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Item Code {idx + 1}
      </label>
      <CreatableSelect
        value={row.code ? { label: row.code, value: row.code } : null}
        onChange={handleItemCodeChange(idx)}
        options={items.map((i) => ({ label: i.code, value: i.code }))}
        placeholder="Select or create item code"
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            borderColor: '#D1D5DB',
            padding: '2px',
            boxShadow: 'none',
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#2563eb' : '#fff',
            color: state.isSelected ? '#fff' : '#000',
            padding: '10px',
          }),
        }}
      />
    </div>

    {/* Material */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Material {idx + 1}
      </label>
      <input
        value={row.material}
        onChange={handleRowInput(idx, 'material')}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
      />
    </div>

    {/* Size */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Size {idx + 1}
      </label>
      <input
        value={row.size}
        onChange={handleRowInput(idx, 'size')}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
      />
    </div>
  </div>
))}

{/* Quantity Treated */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Quantity Treated 1
  </label>
  <input
    type="text"
    name="qtyTreated1"
    value={formData.qtyTreated1}
    onChange={handleChange}
    min="0"
    required
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Quantity Treated 2
  </label>
  <input
    type="text"
    name="qtyTreated2"
    value={formData.qtyTreated2}
    onChange={handleChange}
    min="0"

    
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>




{/* Container Number */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Container Number
  </label>
  <input
    type="text"
    name="containerNumber"
    value={formData.containerNumber}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

{/* Country */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Country
  </label>
  <input
    type="text"
    name="country"
    value={formData.country}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>


{/* Attaining Time (mins) */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Attaining Time (mins)
  </label>
  <input
    type="text"
    name="attainingTimeMins"
    value={formData.attainingTimeMins}
    onChange={handleChange}
    min="0"
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

{/* Total Treatment Time (mins) */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Total Treatment Time (mins)
  </label>
  <input
    type="text"
    name="totalTreatmentTimeMins"
    value={formData.totalTreatmentTimeMins}
    onChange={handleChange}
    min="0"
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

{/* Moisture Before Treatment (%) */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
     Before Treatment (%)
  </label>
  <input
    type="number"
    name="moistureBeforeTreatment"
    value={formData.moistureBeforeTreatment}
    onChange={handleChange}
    min="0"
    max="100"
    step="0.1"
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>

{/* Moisture After Treatment (%) */}
<div className="mb-4 sm:mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    After Treatment (%)
  </label>
  <input
    type="number"
    name="moistureAfterTreatment"
    value={formData.moistureAfterTreatment}
    onChange={handleChange}
    min="0"
    max="100"
    step="0.1"
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>


{/* Note */}
<div className="mb-6 sm:col-span-2">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Note
  </label>
  <textarea
    rows={3}
    name="note"
    value={formData.note}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>



{/* Submit Buttons */}
<div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8">
  <button
    type="button"
    onClick={() => navigate('/certificates')}
    className="rounded-lg bg-gray-400 px-6 py-3 font-semibold text-white shadow-md hover:bg-gray-500 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-300"
  >
    Cancel
  </button>
  <button
  type="submit"
  disabled={loading || submitting}
  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800
             px-6 py-3 font-semibold text-white shadow-lg
             hover:from-blue-700 hover:to-blue-900 transition
             duration-300 ease-in-out focus:outline-none
             focus:ring-4 focus:ring-blue-300
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  {submitting ? (
    <span className="flex items-center justify-center">
      {/* simple Tailwind spinner */}
      <svg
        className="animate-spin h-5 w-5 mr-2 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      Generating…
    </span>
  ) : (
    isEditing ? "Update Certificate" : "Generate PDF"
  )}
</button>

</div>
<div>
      {/* Your form JSX */}

      {/* Button to navigate to all certificates */}
      <Link
        to="/certificates"
        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Show All Certificates
      </Link>
    </div>
     {/* Footer text */}
     <p className="mt-8 text-right text-sm text-gray-600 italic tracking-wide select-none">
  Designed and Developed by<br />
  <a
    href="https://bulkymarketing.com"  
    target="_blank"
    rel="noopener noreferrer"
    className="font-bold text-blue-600  hover:text-blue-900 text-left"
  >Bulky Marketing
  </a>
</p>





</form>
</div>
  );
};

export default CertificateForm;