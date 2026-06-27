import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <div className="ml-64 transition-all duration-300">
        <Outlet />
      </div>
    </div>
  )
}
