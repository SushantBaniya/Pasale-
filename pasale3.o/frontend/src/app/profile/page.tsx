import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBusinessStore } from '../../store/businessStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiBriefcase,
  FiEdit2,
  FiCamera,
  FiSave,
  FiX,
  FiArrowLeft,
  FiShield,
  FiAward,
  FiActivity,
  FiCreditCard,
  FiCheckCircle,
  FiSettings,
} from 'react-icons/fi';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile, userType } = useAuthStore();
  const { businessDetails } = useBusinessStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(userProfile);
  const [success, setSuccess] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateUserProfile(editData);
    setIsEditing(false);
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCancel = () => {
    setEditData(userProfile);
    setIsEditing(false);
  };

  const stats = [
    { label: 'Total Sales', value: '₹2,45,000', icon: FiCreditCard, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Transactions', value: '156', icon: FiActivity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Active Since', value: 'Dec 2024', icon: FiCalendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { label: 'Verified', value: 'Yes', icon: FiCheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section with Gradient Background */}
      <div className="relative h-36 sm:h-48 lg:h-56 bg-linear-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-800 dark:via-blue-700 dark:to-indigo-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Back Button */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 border border-white/30"
          >
            <FiArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>

        {/* Settings Button */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="text-white hover:bg-white/20 border border-white/30"
          >
            <FiSettings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 -mt-16 sm:-mt-24 relative z-10 pb-6 sm:pb-8">
        {/* Success Message */}
        {success && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-xs sm:text-sm font-medium animate-in slide-in-from-top duration-300">
            <FiCheckCircle className="inline-block w-4 h-4 mr-1.5 sm:mr-2" />
            {success}
          </div>
        )}

        {/* Profile Card */}
        <Card className="p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 shadow-xl border-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Profile Photo */}
            <div className="relative group mx-auto sm:mx-0 shrink-0">
              {(isEditing ? editData.photo : userProfile.photo) ? (
                <img
                  src={isEditing ? editData.photo! : userProfile.photo!}
                  alt="Profile"
                  className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                  <FiUser className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white" />
                </div>
              )}
              
              {isEditing && (
                <label className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 sm:p-2.5 rounded-full cursor-pointer shadow-lg transition-all duration-200 group-hover:scale-110">
                  <FiCamera className="w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
              
              {/* Verification Badge */}
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 bg-green-500 text-white p-1 sm:p-1.5 rounded-full shadow-md">
                <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
                    {userProfile.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs sm:text-sm font-medium">
                      <FiBriefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {userType === 'business' ? 'Business' : 'Personal'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs sm:text-sm font-medium">
                      <FiShield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Verified
                    </span>
                  </div>
                </div>

                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    size="sm"
                  >
                    <FiEdit2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                ) : (
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <FiX className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FiSave className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Save</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className={`${stat.bg} rounded-lg sm:rounded-xl p-2 sm:p-3 text-center transition-transform hover:scale-105`}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} mx-auto mb-0.5 sm:mb-1`} />
                      <p className={`text-sm sm:text-lg font-bold ${stat.color} truncate`}>{stat.value}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Personal Information */}
          <Card className="p-4 sm:p-6 shadow-lg border-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                Personal Information
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Full Name
                    </label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Phone Number
                    </label>
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="Enter your phone"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{userProfile.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                      <FiMail className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{userProfile.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                      <FiPhone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{userProfile.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  {userProfile.panNumber && (
                    <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                        <FiCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">PAN Number</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{userProfile.panNumber}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Business Information */}
          {userType === 'business' && (
            <Card className="p-4 sm:p-6 shadow-lg border-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  Business Information
                </h2>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                    <FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Business Name</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {businessDetails?.businessName || 'My Business'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center shrink-0">
                    <FiCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">PAN Number</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {businessDetails?.panNumber || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center shrink-0">
                    <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Business Address</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      Kathmandu, Nepal
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Account Security */}
          <Card className={`p-4 sm:p-6 shadow-lg border-0 ${userType !== 'business' ? 'lg:col-span-1' : ''}`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <FiShield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                Account Security
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">Email Verified</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Your email is verified</p>
                  </div>
                </div>
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-[10px] sm:text-xs font-medium rounded-full shrink-0">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">Phone Verified</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Your phone is verified</p>
                  </div>
                </div>
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-[10px] sm:text-xs font-medium rounded-full shrink-0">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <FiAward className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">Account Status</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Premium member</p>
                  </div>
                </div>
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-medium rounded-full shrink-0">
                  Premium
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 sm:mt-4 border-gray-300 dark:border-gray-600"
              onClick={() => navigate('/settings')}
            >
              <FiSettings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Manage Security Settings</span>
              <span className="sm:hidden">Security Settings</span>
            </Button>
          </Card>

          {/* Recent Activity - Only show for personal accounts to fill space */}
          {userType !== 'business' && (
            <Card className="p-4 sm:p-6 shadow-lg border-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                  <FiActivity className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  Recent Activity
                </h2>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {[
                  { action: 'Profile updated', time: '2 hours ago', icon: FiEdit2 },
                  { action: 'New invoice created', time: '5 hours ago', icon: FiCreditCard },
                  { action: 'Payment received', time: '1 day ago', icon: FiCheckCircle },
                  { action: 'Settings changed', time: '2 days ago', icon: FiSettings },
                ].map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {activity.action}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
