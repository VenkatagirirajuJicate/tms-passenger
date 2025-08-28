'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus, 
  Info,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

// Accordion Component
interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface AccordionProps {
  children: React.ReactElement<AccordionItemProps>[];
  type?: 'single' | 'multiple';
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? 'auto' : 0);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(isOpen ? contentHeight : 0);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggleOpen}
        disabled={disabled}
        className={`
          w-full px-4 py-4 text-left flex items-center justify-between
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer'}
          transition-colors duration-200
        `}
      >
        <div className="flex items-center space-x-3">
          {Icon && (
            <Icon className="w-5 h-5 text-gray-500" />
          )}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>
      
      <motion.div
        initial={false}
        animate={{ height: height }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="px-4 pb-4">
          <div className="border-t border-gray-100 pt-4">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const Accordion: React.FC<AccordionProps> = ({
  children,
  type = 'multiple',
  className = ''
}) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const handleItemToggle = (index: number) => {
    if (type === 'single') {
      setOpenItems(new Set(openItems.has(index) ? [] : [index]));
    } else {
      const newOpenItems = new Set(openItems);
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
      setOpenItems(newOpenItems);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
          key: index,
          ...child.props,
        })
      )}
    </div>
  );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'card' | 'minimal';
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  children,
  defaultOpen = false,
  variant = 'default',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variants = {
    default: 'border border-gray-200 rounded-lg',
    card: 'bg-white border border-gray-200 rounded-xl shadow-sm',
    minimal: 'border-b border-gray-200'
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="border-t border-gray-100 pt-6">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Expandable Card Component
interface ExpandableCardProps {
  title: string;
  summary: React.ReactNode;
  details: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  defaultExpanded?: boolean;
  className?: string;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  summary,
  details,
  icon: Icon,
  defaultExpanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      layout
      className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-green-600" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? (
              <Minus className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="space-y-4">
          {summary}
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-100 pt-4">
                  {details}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Show More/Less Component
interface ShowMoreProps {
  children: string;
  maxLength?: number;
  className?: string;
}

export const ShowMore: React.FC<ShowMoreProps> = ({
  children,
  maxLength = 150,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (children.length <= maxLength) {
    return <span className={className}>{children}</span>;
  }

  const truncatedText = children.substring(0, maxLength) + '...';
  
  return (
    <span className={className}>
      {isExpanded ? children : truncatedText}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 text-green-600 hover:text-green-700 font-medium text-sm"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  );
};

// Tabs Component with Lazy Loading
interface TabProps {
  label: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  defaultTab?: number;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <div>{children}</div>;
};

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultTab = 0,
  variant = 'default',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabVariants = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'px-4 py-2 text-sm font-medium rounded-t-lg',
      active: 'bg-white border-l border-r border-t border-gray-200 text-green-600',
      inactive: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'px-4 py-2 text-sm font-medium rounded-md transition-all',
      active: 'bg-white text-green-600 shadow-sm',
      inactive: 'text-gray-600 hover:text-gray-900'
    },
    underline: {
      container: 'border-b border-gray-200',
      tab: 'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
      active: 'border-green-500 text-green-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }
  };

  const styles = tabVariants[variant];

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={`flex ${styles.container}`}>
        {React.Children.map(children, (child, index) => {
          const { label, icon: Icon, disabled } = child.props;
          const isActive = activeTab === index;
          
          return (
            <button
              key={index}
              onClick={() => !disabled && setActiveTab(index)}
              disabled={disabled}
              className={`
                ${styles.tab}
                ${isActive ? styles.active : styles.inactive}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                flex items-center space-x-2
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {React.Children.toArray(children)[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// FAQ Component
interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
  searchable?: boolean;
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({
  items,
  searchable = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    if (searchTerm) {
      const filtered = items.filter(item =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof item.answer === 'string' && 
         item.answer.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchTerm, items]);

  return (
    <div className={className}>
      {searchable && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FAQ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {filteredItems.map((item, index) => (
          <AccordionItem
            key={index}
            title={item.question}
            icon={HelpCircle}
          >
            <div className="text-gray-600">
              {item.answer}
            </div>
          </AccordionItem>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No FAQ items found matching your search.
        </div>
      )}
    </div>
  );
};

// Step-by-Step Guide Component
interface Step {
  title: string;
  description: string;
  content?: React.ReactNode;
  completed?: boolean;
}

interface StepByStepProps {
  steps: Step[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export const StepByStep: React.FC<StepByStepProps> = ({
  steps,
  currentStep = 0,
  onStepChange,
  className = ''
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);

  const handleStepClick = (step: number) => {
    setActiveStep(step);
    onStepChange?.(step);
  };

  return (
    <div className={className}>
      {/* Step Navigation */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <button
              onClick={() => handleStepClick(index)}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${activeStep === index
                  ? 'bg-green-600 text-white'
                  : step.completed
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
                }
                hover:scale-105 transition-transform
              `}
            >
              {step.completed ? '✓' : index + 1}
            </button>
            
            {index < steps.length - 1 && (
              <div className={`
                w-16 h-px mx-2
                ${step.completed ? 'bg-green-200' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${activeStep < steps.length ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}
            `}>
              {activeStep + 1}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {steps[activeStep]?.title}
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            {steps[activeStep]?.description}
          </p>
          
          {steps[activeStep]?.content && (
            <div className="border-t border-gray-100 pt-4">
              {steps[activeStep].content}
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <button
              onClick={() => activeStep > 0 && handleStepClick(activeStep - 1)}
              disabled={activeStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={() => activeStep < steps.length - 1 && handleStepClick(activeStep + 1)}
              disabled={activeStep === steps.length - 1}
              className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};





