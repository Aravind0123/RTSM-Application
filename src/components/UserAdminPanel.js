// src/components/UserAdminPanel.js
import React, { useState } from 'react';
import { Users, UserPlus } from '../icons/index.js'; // Import icons from the new path

const UserAdminPanel = ({ users, fetchUsers, userId, API_BASE_URL, setLoading, setError }) => {
  const [activeSubTab, setActiveSubTab] = useState('manageUsers'); // 'manageUsers' or 'addUser'

  // Form states for adding a new user
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState('');
  const [newUserSiteId, setNewUserSiteId] = useState('');

  // Handle adding a new user via the Python backend
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("User not authenticated. Cannot add user.");
      return;
    }
    if (!newUserEmail || !newUserRole || !newUserAccessLevel) {
      setError("Please fill all required fields (Email, Role, Access Level).");
      return;
    }
    if (newUserAccessLevel === 'Site' && !newUserSiteId) {
      setError("Site ID is required for Site-level access.");
      return;
    }

    setLoading(true);
    try {
      const newUser = {
        email: newUserEmail,
        role: newUserRole,
        accessLevel: newUserAccessLevel,
        siteId: newUserAccessLevel === 'Site' ? newUserSiteId : null,
        createdBy: userId,
      };

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setNewUserEmail('');
      setNewUserRole('');
      setNewUserAccessLevel('');
      setNewUserSiteId('');
      setError(null);
      setActiveSubTab('manageUsers'); // Switch back to manage users after adding
      fetchUsers(); // Re-fetch users to update the list
      console.log("User added successfully:", result);
    } catch (err) {
      console.error("Error adding user:", err);
      setError(`Failed to add user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a user via the Python backend
  const handleDeleteUser = async (userIdToDelete) => {
    if (!userId) {
      setError("User not authenticated. Cannot delete user.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userIdToDelete}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setError(null);
      fetchUsers(); // Re-fetch users to update the list
      console.log("User deleted successfully:", result);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(`Failed to delete user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Sub-navigation for User Admin */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveSubTab('manageUsers')}
          className={`py-2 px-4 text-lg font-medium transition-colors duration-300
            ${activeSubTab === 'manageUsers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveSubTab('addUser')}
          className={`py-2 px-4 text-lg font-medium transition-colors duration-300
            ${activeSubTab === 'addUser' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
        >
          Add New User
        </button>
      </div>

      {activeSubTab === 'manageUsers' && (
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Study Users</h2>
          {users.length === 0 ? (
            <p className="text-gray-600">No users found. Add a new user to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left rounded-tl-lg">Email</th>
                    <th className="py-3 px-6 text-left">Role</th>
                    <th className="py-3 px-6 text-left">Access Level</th>
                    <th className="py-3 px-6 text-left">Site ID</th>
                    <th className="py-3 px-6 text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{user.email}</td>
                      <td className="py-3 px-6 text-left">{user.role}</td>
                      <td className="py-3 px-6 text-left">{user.accessLevel}</td>
                      <td className="py-3 px-6 text-left">{user.siteId || 'N/A'}</td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full text-xs transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'addUser' && (
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Add New User</h2>
          <form onSubmit={handleAddUser} className="space-y-6 p-6 bg-gray-50 rounded-lg shadow-inner">
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
                User Email:
              </label>
              <input
                type="email"
                id="email"
                className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-gray-700 text-sm font-semibold mb-2">
                Role:
              </label>
              <select
                id="role"
                className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                <option value="Statistician">Statistician</option>
                <option value="User Administrator">User Administrator</option>
                <option value="Investigator">Investigator</option>
                <option value="Monitor">Monitor</option>
              </select>
            </div>

            <div>
              <label htmlFor="accessLevel" className="block text-gray-700 text-sm font-semibold mb-2">
                Access Level:
              </label>
              <select
                id="accessLevel"
                className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={newUserAccessLevel}
                onChange={(e) => setNewUserAccessLevel(e.target.value)}
                required
              >
                <option value="">Select Access Level</option>
                <option value="Global">Study Level (Global)</option>
                <option value="Site">Centre Level (Specific Site)</option>
              </select>
            </div>

            {newUserAccessLevel === 'Site' && (
              <div>
                <label htmlFor="siteId" className="block text-gray-700 text-sm font-semibold mb-2">
                  Site ID:
                </label>
                <input
                  type="text"
                  id="siteId"
                  className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  value={newUserSiteId}
                  onChange={(e) => setNewUserSiteId(e.target.value)}
                  placeholder="e.g., Site001"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            >
              Add User
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserAdminPanel;
