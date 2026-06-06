import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, X, Search } from 'lucide-react'

const STEPS = ['Basic Info', 'Line Items', 'Assign Vendors', 'Attachments']

export default function RFQCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [items, setItems] = useState([{ product_name: '', quantity: '', unit: '', specifications: '' }])
  const [selectedVendors, setSelectedVendors] = useState([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [files, setFiles] = useState([])

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-active'],
    queryFn: () => api.get('/vendors?status=active&limit=100').then(r => r.data),
  })

  const filteredVendors = (vendorsData?.vendors || []).filter(v =>
    !vendorSearch || v.company_name.toLowerCase().includes(vendorSearch.toLowerCase())
  )

  const addItem = () => setItems([...items, { product_name: '', quantity: '', unit: '', specifications: '' }])
  const removeItem = (i) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => {
    const updated = [...items]
    updated[i][field] = value
    setItems(updated)
  }

  const toggleVendor = (id) => {
    setSelectedVendors(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles([...files, ...newFiles].slice(0, 10))
  }

  const canProceed = () => {
    if (step === 0) return title.trim() && deadline
    if (step === 1) return items.every(i => i.product_name.trim() && i.quantity > 0)
    if (step === 2) return selectedVendors.length > 0
    return true
  }

  const handleSubmit = async () => {
    if (!canProceed()) return toast.error('Please complete all required fields')
    setLoading(true)
    try {
      const body = {
        title, description,
        deadline: new Date(deadline).toISOString(),
        items: items.map(i => ({ ...i, quantity: parseFloat(i.quantity) })),
        vendor_ids: selectedVendors,
      }
      const res = await api.post('/rfqs', body)
      const rfqId = res.data.id

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        await api.post(`/rfqs/${rfqId}/attachments`, formData)
      }

      toast.success('RFQ Created!')
      navigate(`/rfqs/${rfqId}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to create RFQ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Create RFQ</h2>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{i + 1}</div>
            <span className={`text-sm hidden md:block ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Title * <span className="text-gray-400 text-xs">({title.length}/300)</span></Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={300} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
              </div>
              <div>
                <Label>Deadline *</Label>
                <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Label className="text-xs">Product Name *</Label>
                    <Input value={item.product_name} onChange={e => updateItem(i, 'product_name', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qty *</Label>
                    <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unit</Label>
                    <Input value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="pcs, kg" />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Specs</Label>
                    <Input value={item.specifications} onChange={e => updateItem(i, 'specifications', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={items.length === 1}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addItem}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input placeholder="Search vendors..." className="pl-9" value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} />
              </div>
              <p className="text-sm text-gray-500">{selectedVendors.length} vendors selected</p>
              <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                {filteredVendors.map(v => (
                  <label key={v.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedVendors.includes(v.id)}
                      onChange={() => toggleVendor(v.id)} className="rounded" />
                    <span className="font-medium">{v.company_name}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{v.category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Attachments (optional)</Label>
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                onChange={handleFiles} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700" />
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                  <span>{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                  <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('/rfqs')} disabled={step === 0 && false}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => canProceed() ? setStep(step + 1) : toast.error('Complete required fields')}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create RFQ
          </Button>
        )}
      </div>
    </div>
  )
}
