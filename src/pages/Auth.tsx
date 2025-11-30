import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agreeTerms: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedUsername = formData.name.trim().toLowerCase();
    const trimmedPassword = formData.password.trim();
    // Untuk sistem lokal, kita cukup login dengan email saja (tanpa verifikasi)
    if (!trimmedUsername) {
      toast.error("Username tidak boleh kosong", {
        description: "Error",
      });
      setLoading(false);
      return;
    }
    if (trimmedPassword !== "123" && trimmedPassword !== "admin") {
      toast.error("Password salah. Gunakan password: '123' atau 'admin'", {
        description: "Error",
      });
      setLoading(false);
    return;
    }

    // Simpan email sebagai current_user
     localStorage.setItem("current_user", trimmedUsername);
     console.log("LOGIN BERHASIL:", trimmedUsername);
     console.log("CEK current_user di localStorage:", localStorage.getItem("current_user"));


    // Inisialisasi data kosong untuk user baru jika belum ada
     const keys = ["products", "transactions", "purchases", "journalEntries", "expenses"];
    keys.forEach((key) => {
      const userKey = `${trimmedUsername}_${key}`;
      if (!localStorage.getItem(userKey)) {
          localStorage.setItem(userKey, JSON.stringify([]));
        }
      });

    navigate('/dashboard');
    setLoading(false);
  };

  return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div className="w-full max-w-6xl">
      <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Left side - Branding */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-32">
              <svg viewBox="0 0 100 400" className="h-full w-full text-white/10" preserveAspectRatio="none">
                <path d="M0,0 Q50,100 0,200 T0,400 L100,400 L100,0 Z" fill="currentColor" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="mb-8">
                <img src="/Finsera.svg" alt="Finsera Logo" className="h-16 w-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">Welcome to</h1>
                <h2 className="text-4xl font-bold text-white">Finsera</h2>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
                Selamat datang di sistem POS Berbasis Website Canggih.
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-12 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isLogin ? 'Sign In' : 'Create your account'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username input selalu muncul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Masukkan username bebas"
                    className="h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Password: 123 atau admin"
                    className="h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Terms hanya saat sign up */}
                {!isLogin && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeTerms', checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms & Conditions</span>
                    </label>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFormData({ name: '', email: '', password: '', agreeTerms: false });
                    }}
                    className="flex-1 h-12 border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);
};

export default Auth;
