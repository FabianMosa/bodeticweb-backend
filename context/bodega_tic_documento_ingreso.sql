-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: bodega_tic
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `documento_ingreso`
--

DROP TABLE IF EXISTS `documento_ingreso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documento_ingreso` (
  `PK_id_documento` int NOT NULL AUTO_INCREMENT,
  `FK_id_proveedor` int NOT NULL,
  `codigo_documento` varchar(100) NOT NULL,
  `fecha_emision` date NOT NULL,
  PRIMARY KEY (`PK_id_documento`),
  UNIQUE KEY `codigo_documento` (`codigo_documento`),
  KEY `FK_id_proveedor` (`FK_id_proveedor`),
  CONSTRAINT `documento_ingreso_ibfk_1` FOREIGN KEY (`FK_id_proveedor`) REFERENCES `proveedor` (`PK_id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documento_ingreso`
--

LOCK TABLES `documento_ingreso` WRITE;
/*!40000 ALTER TABLE `documento_ingreso` DISABLE KEYS */;
INSERT INTO `documento_ingreso` VALUES (1,1,'FAC-001-2024','2024-03-10'),(2,2,'FAC-002-2024','2024-03-12'),(3,3,'FAC-003-2024','2024-03-14'),(4,4,'FAC-004-2024','2024-03-17'),(5,1,'FAC-005-2024','2024-03-19'),(7,2,'prueba4','2026-01-02');
/*!40000 ALTER TABLE `documento_ingreso` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-25 14:15:13
