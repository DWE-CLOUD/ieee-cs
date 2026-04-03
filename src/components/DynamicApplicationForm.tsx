import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Upload, FileText, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FormField } from '@/components/admin/FormBuilder';
import { api } from '@/lib/api';

interface Position {
  id: string;
  title: string;
  form_fields?: FormField[];
}

interface DynamicApplicationFormProps {
  position: Position;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  [key: string]: string | string[] | File | null;
}

export const DynamicApplicationForm = ({ position, onClose, onSuccess }: DynamicApplicationFormProps) => {
  const { user } = useAuth();
  const [formValues, setFormValues] = useState<FormValues>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const formFields: FormField[] = (position.form_fields as FormField[]) || [];

  useEffect(() => {
    setTimeout(() => setModalVisible(true), 10);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setModalVisible(false);
    setTimeout(onClose, 300);
  };

  const handleInputChange = (fieldId: string, value: string | string[] | File | null) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (field: FormField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = (field.maxSize || 5) * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File must be less than ${field.maxSize || 5}MB`);
        return;
      }
      handleInputChange(field.id, file);
    }
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const current = (formValues[fieldId] as string[]) || [];
    if (checked) {
      handleInputChange(fieldId, [...current, option]);
    } else {
      handleInputChange(fieldId, current.filter(o => o !== option));
    }
  };

  const validateForm = (): boolean => {
    for (const field of formFields) {
      if (field.required) {
        const value = formValues[field.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          toast.error(`${field.label} is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to apply');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('position_id', position.id);
      formData.append('full_name', user.email?.split('@')[0] || 'Applicant');

      const responses = [];
      
      for (const field of formFields) {
        let responseValue = formValues[field.id];
        
        if (field.type === 'file' && responseValue instanceof File) {
          formData.append(field.id, responseValue);
          responseValue = responseValue.name;
        }

        if (Array.isArray(responseValue)) {
          responseValue = responseValue.join(', ');
        }

        if (responseValue && typeof responseValue === 'string') {
          responses.push({
            field_id: field.id,
            field_label: field.label,
            field_type: field.type,
            response_value: responseValue,
          });
        }
      }
      formData.append('responses', JSON.stringify(responses));
      await api.post('/api/applications', formData);

      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={(value as string) === opt}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={((value as string[]) || []).includes(opt)}
                  onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
      {
        const fileValue = value as File | null;
        return (
          <div>
            <input
              ref={el => fileInputRefs.current[field.id] = el}
              type="file"
              accept={field.accept || '.pdf,.doc,.docx'}
              onChange={(e) => handleFileChange(field, e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRefs.current[field.id]?.click()}
              className="w-full px-4 py-3 rounded-xl border border-dashed border-border bg-background hover:bg-muted/50 transition-all duration-300 flex items-center justify-center gap-2 text-muted-foreground"
            >
              {fileValue ? (
                <>
                  <FileText className="w-5 h-5 text-accent" />
                  <span className="text-foreground truncate">{fileValue.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload file ({field.accept || '.pdf,.doc,.docx'})</span>
                </>
              )}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">Max {field.maxSize || 5}MB</p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (formFields.length === 0) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-md" />
        <div 
          className={`relative bg-background rounded-3xl max-w-lg w-full shadow-elegant transition-all duration-500 ${modalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 text-center">
            <h2 className="font-serif text-2xl text-foreground mb-4">Apply for {position.title}</h2>
            <p className="text-muted-foreground mb-6">No application form has been set up for this position yet. Please contact the admin.</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-md" />
      
      <div 
        className={`relative bg-background rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-elegant transition-all duration-500 ${modalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center hover:bg-foreground hover:text-primary-foreground transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-serif text-2xl text-foreground mb-2 pr-12">Apply for {position.title}</h2>
          <p className="text-muted-foreground mb-6">Fill in your details to submit your application.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-foreground text-primary-foreground font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DynamicApplicationForm;
