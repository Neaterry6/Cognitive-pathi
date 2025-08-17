import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-80 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex justify-between items-center">
            Calculator
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-gray-700">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 p-4 bg-gray-900 rounded text-right">
            <div className="text-2xl text-white font-mono">{display}</div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <Button onClick={clear} className="bg-red-600 hover:bg-red-700 text-white">
              C
            </Button>
            <Button onClick={clearEntry} className="bg-orange-600 hover:bg-orange-700 text-white">
              CE
            </Button>
            <Button onClick={() => inputOperation('÷')} className="bg-blue-600 hover:bg-blue-700 text-white">
              ÷
            </Button>
            <Button onClick={() => inputOperation('×')} className="bg-blue-600 hover:bg-blue-700 text-white">
              ×
            </Button>

            {/* Row 2 */}
            <Button onClick={() => inputNumber('7')} className="bg-gray-700 hover:bg-gray-600 text-white">
              7
            </Button>
            <Button onClick={() => inputNumber('8')} className="bg-gray-700 hover:bg-gray-600 text-white">
              8
            </Button>
            <Button onClick={() => inputNumber('9')} className="bg-gray-700 hover:bg-gray-600 text-white">
              9
            </Button>
            <Button onClick={() => inputOperation('-')} className="bg-blue-600 hover:bg-blue-700 text-white">
              -
            </Button>

            {/* Row 3 */}
            <Button onClick={() => inputNumber('4')} className="bg-gray-700 hover:bg-gray-600 text-white">
              4
            </Button>
            <Button onClick={() => inputNumber('5')} className="bg-gray-700 hover:bg-gray-600 text-white">
              5
            </Button>
            <Button onClick={() => inputNumber('6')} className="bg-gray-700 hover:bg-gray-600 text-white">
              6
            </Button>
            <Button onClick={() => inputOperation('+')} className="bg-blue-600 hover:bg-blue-700 text-white">
              +
            </Button>

            {/* Row 4 */}
            <Button onClick={() => inputNumber('1')} className="bg-gray-700 hover:bg-gray-600 text-white">
              1
            </Button>
            <Button onClick={() => inputNumber('2')} className="bg-gray-700 hover:bg-gray-600 text-white">
              2
            </Button>
            <Button onClick={() => inputNumber('3')} className="bg-gray-700 hover:bg-gray-600 text-white">
              3
            </Button>
            <Button onClick={performCalculation} className="bg-green-600 hover:bg-green-700 text-white row-span-2">
              =
            </Button>

            {/* Row 5 */}
            <Button onClick={() => inputNumber('0')} className="bg-gray-700 hover:bg-gray-600 text-white col-span-2">
              0
            </Button>
            <Button onClick={inputDot} className="bg-gray-700 hover:bg-gray-600 text-white">
              .
            </Button>
          </div>

          {/* Scientific functions */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button 
              onClick={() => setDisplay(String(Math.sin(parseFloat(display) * Math.PI / 180)))} 
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              sin
            </Button>
            <Button 
              onClick={() => setDisplay(String(Math.cos(parseFloat(display) * Math.PI / 180)))} 
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              cos
            </Button>
            <Button 
              onClick={() => setDisplay(String(Math.tan(parseFloat(display) * Math.PI / 180)))} 
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              tan
            </Button>
            <Button 
              onClick={() => setDisplay(String(Math.log10(parseFloat(display))))} 
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              log
            </Button>
            <Button 
              onClick={() => setDisplay(String(Math.sqrt(parseFloat(display))))} 
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              √
            </Button>
            <Button 
              onClick={() => setDisplay(String(Math.pow(parseFloat(display), 2)))} 
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              x²
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}